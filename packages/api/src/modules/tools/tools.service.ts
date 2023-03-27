import {
  InternalServerErrorException,
  Injectable,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@/schemas';
import { ReturnModelType } from '@typegoose/typegoose';
import { LoggerEnum } from 'enums/enums';
import * as dayjs from 'dayjs';
import { Activity } from '@/schemas/activity.schema';
import { Ticket } from '@/schemas/ticket.schema';
import { TicketCodeService } from '../ticket-code/ticket-code.service';
import { ActivityService } from '@/modules/activity/activity.service';
import * as fs from 'fs';
import * as path from 'path';
import { SRC_DIR } from '@/config/configuration';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(LoggerEnum.tools);

  constructor(
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
    @Inject(forwardRef(() => TicketCodeService))
    private readonly ticketCodeService: TicketCodeService,

    @InjectRedis() private readonly redisService: Redis,
    @InjectModel(User.name)
    private readonly userModel: ReturnModelType<typeof User>,
    @InjectModel(Activity.name)
    private readonly activityModel: ReturnModelType<typeof Activity>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,
  ) {}

  async test() {
    try {
      const cache = this.redisService;
      const ret = await cache.set('test_key', 1);
      const value = await cache.get('test_key');
      if (!ret || Number(value) != 1) {
        throw new Error('connect redis error');
      }
    } catch (error) {
      this.logger.error('connect redis error', error);
      throw new InternalServerErrorException(`connect redis error`);
    }

    try {
      const baseMongo = this.userModel;
      await baseMongo.find();
    } catch (error) {
      this.logger.error('connect mongodb error', error);
      throw new InternalServerErrorException(`connect mongodb error`);
    }
    return 'mongodb and redis connect success';
  }

  /**
   *
   * @description 从项目根目录的 config/activity.json 中读取配置，并落入数据库
   */
  async init() {
    let activityInfos = [];

    try {
      const text = fs
        .readFileSync(path.resolve(SRC_DIR, 'resources/activity.json'))
        .toString();
      activityInfos = JSON.parse(text);
    } catch (error) {
      this.logger.error('read file error', error);
      throw new InternalServerErrorException('read file error');
    }

    if (!activityInfos || activityInfos.length < 1) {
      this.logger.error('Invalid activity infos');
      throw new InternalServerErrorException('Invalid activity infos');
    }

    /// 加载相应的 Model 和 Service
    let allRet = true;
    const activityModel = this.activityModel;
    const ticketModel = this.ticketModel;
    const codeService = this.ticketCodeService;

    for (const activityInfo of activityInfos) {
      // 循环处理导入
      const actInfo = activityInfo['activityInfo'];

      const preRowInfo = await activityModel.findOne({
        aid: actInfo['aid'],
      });
      if (preRowInfo) {
        this.logger.warn('it has before, continue', preRowInfo);
        continue;
      }
      actInfo['startTime'] = dayjs().unix();
      actInfo['endTime'] = dayjs().unix() + actInfo.days * 86400;

      delete actInfo['days'];

      // 插入活动信息
      const activity = await activityModel.create(actInfo);

      // 插入票信息
      const ticketInfo = activityInfo['ticketInfo'];
      ticketInfo['activityId'] = activity.id;
      ticketInfo['startTime'] = dayjs().unix();
      ticketInfo['endTime'] = dayjs().unix() + ticketInfo.days * 86400;
      const ticket = await ticketModel.create(ticketInfo);

      // 导入券码列表
      const ret = await codeService.import(
        activity.aid,
        ticket.id,
        activityInfo['codeList'],
      );
      allRet = allRet && ret;
    }

    // 设置缓存
    await this.activityService.cacheList();

    if (allRet) {
      return 'init success';
    }

    throw new InternalServerErrorException(
      'init failed, pls check the local log',
    );
  }
}
