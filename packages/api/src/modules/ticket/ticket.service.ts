import { ActivityService } from '@/modules/activity/activity.service';
import { cache } from '@/lib/cache';
import { TicketCodeService } from '@/modules/ticket-code/ticket-code.service';
import { Ticket } from '@/schemas/ticket.schema';
import { TicketHistoryService } from '@/modules/ticket-history/ticket-history.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys } from 'enums/redisEnums';
import Redis from 'ioredis';
import { DataObj } from '@/common/class/data-obj.class';

const CACHE_TIME_SEC = 0;

@Injectable()
export class TicketService {
  private readonly logger = new Logger(LoggerEnum.ticket);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,

    @Inject(forwardRef(() => TicketCodeService))
    private readonly ticketCodeService: TicketCodeService,
    @Inject(forwardRef(() => ActivityService))
    private readonly activityService: ActivityService,
    private readonly ticketHistoryService: TicketHistoryService,
  ) {}

  async cacheDetailById(ticketId: string) {
    if (!ticketId) {
      return false;
    }
    const ticketModel = this.ticketModel;
    const ticketInfo = await ticketModel.findById(ticketId);
    return await this.cacheDetail(ticketInfo);
  }

  async cacheDetail(ticketInfo: Ticket) {
    if (!ticketInfo) {
      return;
    }

    cache.setClient(this.redis);
    const ret = await cache.set(
      RedisKeys.TICKET_DETAIL_CACHE_KEY.replace(
        '{ticketId}',
        ticketInfo['_id'],
      ),
      JSON.stringify(ticketInfo),
      CACHE_TIME_SEC,
      true,
    );
    if (!ret) {
      this.logger.error(
        `cache activity info ${ticketInfo['_id']} list error`,
        ticketInfo,
      );
    }
    return ret;
  }

  async get(aid: string, userId: string) {
    try {
      await this.activityService.checkEnable(aid, userId);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }

    const code = await this.ticketCodeService.getOneCode(aid, userId);

    // 获取票信息
    const ticketId = await this.ticketCodeService.getDetailByCode(code);
    let ticketInfo: Ticket | undefined = undefined;
    if (!ticketId) {
      this.logger.error('get code ticket mapping error', { code });
    } else {
      ticketInfo = await this.ticketModel.findById(ticketId).lean();
    }

    this.ticketHistoryService.insertHistory(aid, code, userId);

    if (!ticketInfo) {
      return { code };
    }

    return { ...ticketInfo, code };
  }

  getDetailById(id) {
    return this.ticketModel.findById(id).populate(['activity']);
  }

  async getList(queryOption = {}, sort: any, limit = 0, offset = 0) {
    const collection = this.ticketModel;
    let queryFun = collection.find(queryOption);

    if (sort) {
      sort = typeof sort === 'string' ? JSON.parse(sort) : sort;
      queryFun = queryFun.sort(sort);
    }
    if (limit > 0) {
      queryFun = queryFun.limit(limit);
    }
    if (offset > 0) {
      queryFun = queryFun.skip(offset);
    }
    const queryArr = await queryFun;

    return queryArr;
  }

  async list(filter: any) {
    const collection = this.ticketModel;

    // eslint-disable-next-line prefer-const
    let { page, pageSize, sort, ...rest } = filter;

    page = page ? page - 1 : 0;
    pageSize = pageSize || 20;

    const list = await this.getList(rest, sort, pageSize, page * pageSize);
    const total = await collection.countDocuments(rest);
    return { list, total };
  }
}
