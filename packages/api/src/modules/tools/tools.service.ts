import {
  InternalServerErrorException,
  Injectable,
  Logger,
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
    @InjectRedis() private readonly redisService: Redis,
    @InjectModel(User.name)
    private readonly userModel: ReturnModelType<typeof User>,
    @InjectModel(Activity.name)
    private readonly activityModel: ReturnModelType<typeof Activity>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,
    private readonly ticketCodeService: TicketCodeService,
    private readonly actService: ActivityService,
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
    return {
      data: 'mongodb and redis connect success',
    };
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
    const allRet = true;
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
      const actId = await activityModel.create(actInfo);
      actId.save();

      // 插入票信息
      const ticketInfo = activityInfo['ticketInfo'];
      ticketInfo['actId'] = actId;
      ticketInfo['startTime'] = dayjs().unix();
      ticketInfo['endTime'] = dayjs().unix() + ticketInfo.days * 86400;
      const ticketId = await ticketModel.create(ticketInfo);
      ticketId.save();

      // // 导入券码列表
      // const ret = await codeService.import(
      //   actId.aid,
      //   ticketId.id,
      //   activityInfo['codeList'],
      // );
      // allRet = allRet && ret;
    }

    // 设置缓存
    await this.actService.cacheList();

    if (allRet) {
      return { data: 'init success' };
    }

    throw new InternalServerErrorException(
      'init failed, pls check the local log',
    );
  }
}
