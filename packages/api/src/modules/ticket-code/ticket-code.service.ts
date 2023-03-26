import { cache } from '@/lib/cache';
import { Activity } from '@/schemas/activity.schema';
import { Ticket } from '@/schemas/ticket.schema';
import { TicketCode } from '@/schemas/ticketCode.schema';
import { TicketService } from '@/ticket/ticket.service';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys } from 'enums/redisEnums';
import Redis from 'ioredis';

const CACHE_TIME_SEC = 0;

@Injectable()
export class TicketCodeService {
  private readonly logger = new Logger(LoggerEnum.ticketCode);

  constructor(
    @InjectModel(TicketCode.name)
    private readonly ticketCodeModel: ReturnModelType<typeof TicketCode>,
    @InjectRedis() private readonly redisService: Redis,
    @InjectModel(Activity.name)
    private readonly activityModel: ReturnModelType<typeof Activity>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,

    private readonly ticketService: TicketService,
  ) {}

  async import(actId: string, ticketId: string, ticketCodes: any[]) {
    const codeModel = this.ticketCodeModel;
    const ticketModel = this.ticketModel;
    const actModel = this.activityModel;

    cache.setClient(this.redisService);

    if (
      !actModel.findOne({
        aid: actId,
      })
    ) {
      this.logger.error('wrong act id', { actId, ticketId, ticketCodes });
      return false;
    }
    if (!ticketModel.findById(ticketId)) {
      this.logger.error('wrong ticket id', { actId, ticketId, ticketCodes });
      return false;
    }
    if (!ticketCodes || ticketCodes.length < 1) {
      this.logger.error('ticket codes is not right', {
        actId,
        ticketId,
        ticketCodes,
      });
      return false;
    }
    const filterList = [];
    let rowList = [];
    for (const ticketCode of ticketCodes) {
      if (!ticketCode || ticketCode.length < 5) {
        continue;
      }
      const codeInfo = await this.getInfoByCodeAndTicket(ticketCode, ticketId);
      if (codeInfo) {
        continue;
      }
      filterList.push(ticketCode);
      rowList.push({
        ticketId: ticketId,
        code: ticketCode,
      });
    }
    if (!filterList || filterList.length < 1) {
      this.logger.error('has alreay import', {
        actId,
        ticketCodes,
        filterList,
      });
      return false;
    }
    const successList = await this.lpushCodes(actId, filterList);
    if (!successList || successList.length < 1) {
      this.logger.error('lpush redis error', { actId, filterList });
      return false;
    }
    rowList = rowList.filter((rowInfo) => {
      return successList.includes(rowInfo['code']);
    });

    if (rowList.length < 1) {
      return true;
    }

    const mongoRet = await codeModel.insertMany(rowList);
    if (!mongoRet) {
      this.logger.error('insert mongodb error, pls retry later', {
        mongoRet,
        rowList,
      });
    }

    const ticketService = this.ticketService;
    rowList.forEach(async (rowInfo) => {
      const setRet = await cache.set(
        RedisKeys.CODE_TICKET_MAPPING.replace('{code}', rowInfo['code']),
        rowInfo['ticketId'],
        CACHE_TIME_SEC,
      );
      if (!setRet) {
        this.logger.error('set cache error', {
          CODE_TICKET_MAPPING: RedisKeys.CODE_TICKET_MAPPING,
          rowInfo,
        });
      }
      const ticketCacheRet = await ticketService.cacheDetailById(
        rowInfo['ticketId'],
      );
      if (!ticketCacheRet) {
        this.logger.error('set cache ticketInfo error', { rowInfo });
      }
    });
    return true;
  }

  async getInfoByCodeAndTicket(ticketCode: string, ticketId: string) {
    if (!ticketCode) {
      return false;
    }
    const collection = this.ticketCodeModel;
    const queryOption = {
      code: ticketCode,
      ticketId: ticketId,
    };
    const queryArr = await collection.find(queryOption);
    if (!queryArr || queryArr.length < 1) {
      return false;
    }
    const rowInfo = queryArr.pop();

    return rowInfo;
  }

  async lpushCodes(actId, codes) {
    const redisClient = this.redisService;
    const key = RedisKeys.ACT_TICKET_CODES.replace('{actId}', actId);

    const successList = [];
    for (const ticketCode of codes) {
      const lremRet = await redisClient.lrem(key, 0, ticketCode);
      const lpushRet = await redisClient.lpush(key, ticketCode);
      if (lremRet == 0 && lpushRet) {
        successList.push(ticketCode);
      }
    }

    return successList;
  }

  async lpopCode(actId) {
    const redisClient = this.redisService;
    const key = RedisKeys.ACT_TICKET_CODES.replace('{actId}', actId);
    const ret = await redisClient.lpop(key);
    return ret;
  }
}
