import { cache } from '@/lib/cache';
import { Ticket } from '@/schemas/ticket.schema';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys } from 'enums/redisEnums';
import Redis from 'ioredis';

const CACHE_TIME_SEC = 0;

@Injectable()
export class TicketService {
  private readonly logger = new Logger(LoggerEnum.ticket);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,
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
        `cache act info ${ticketInfo['_id']} list error`,
        ticketInfo,
      );
    }
    return ret;
  }
}
