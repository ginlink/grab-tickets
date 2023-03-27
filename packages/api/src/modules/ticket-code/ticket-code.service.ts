import { cache } from '@/lib/cache';
import { Activity, Ticket } from '@/schemas';
import { TicketCode } from '@/schemas/ticketCode.schema';
import { InjectRedis } from '@nestjs-modules/ioredis';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys, RedisReplaceKeys } from 'enums/redisEnums';
import Redis from 'ioredis';
import { TicketService } from '../ticket/ticket.service';

const CACHE_TIME_SEC = 0;

@Injectable()
export class TicketCodeService {
  private readonly logger = new Logger(LoggerEnum.ticketCode);

  // TODO 这里引入 ticketService 会导致循环依赖
  constructor(
    @Inject(forwardRef(() => TicketService))
    private readonly ticketService: TicketService,

    @InjectRedis() private readonly redis: Redis,
    @InjectModel(TicketCode.name)
    private readonly ticketCodeModel: ReturnModelType<typeof TicketCode>,
    @InjectModel(Ticket.name)
    private readonly ticketModel: ReturnModelType<typeof Ticket>,
    @InjectModel(Activity.name)
    private readonly activityModel: ReturnModelType<typeof Activity>,
  ) {
    cache.setClient(redis);
  }

  async import(activityId: string, ticketId: string, ticketCodes: any[]) {
    const codeModel = this.ticketCodeModel;
    const ticketModel = this.ticketModel;
    const actModel = this.activityModel;

    cache.setClient(this.redis);

    if (
      !actModel.findOne({
        aid: activityId,
      })
    ) {
      this.logger.error('wrong activity id', {
        activityId,
        ticketId,
        ticketCodes,
      });
      return false;
    }
    if (!ticketModel.findById(ticketId)) {
      this.logger.error('wrong ticket id', {
        activityId,
        ticketId,
        ticketCodes,
      });
      return false;
    }
    if (!ticketCodes || ticketCodes.length < 1) {
      this.logger.error('ticket codes is not right', {
        activityId,
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
      this.logger.error('has already import', {
        activityId,
        ticketCodes,
        filterList,
      });
      return false;
    }
    const successList = await this.lpushCodes(activityId, filterList);
    if (!successList || successList.length < 1) {
      this.logger.error('lpush redis error', { activityId, filterList });
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

  async lpushCodes(activityId, codes) {
    const redisClient = this.redis;
    const key = RedisKeys.ACT_TICKET_CODES.replace('{activityId}', activityId);

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

  async lpopCode(activityId) {
    const redisClient = this.redis;
    const key = RedisKeys.ACT_TICKET_CODES.replace('{activityId}', activityId);
    const ret = await redisClient.lpop(key);
    return ret;
  }

  async getUserJoinCode(aid: string, userId: string) {
    const res = await cache.get(
      RedisKeys.ACT_USER_JOIN_RESULT.replace(
        RedisReplaceKeys.ACT_USER_JOIN_RESULT_1,
        aid,
      ).replace(RedisReplaceKeys.ACT_USER_JOIN_RESULT_2, userId),
    );

    return !!res ? res : '';
  }

  async getOneCode(aid: string, userId: string) {
    const code = await this.lpopCode(aid);

    if (code === null) {
      throw new BadRequestException('Out of ticket');
    }
    if (!code) {
      this.logger.error('Redis error');
      throw new InternalServerErrorException('Service error');
    }

    // 设置缓存
    const res = await cache.set(
      RedisKeys.ACT_USER_JOIN_RESULT.replace(
        RedisReplaceKeys.ACT_USER_JOIN_RESULT_1,
        aid,
      ).replace(RedisReplaceKeys.ACT_USER_JOIN_RESULT_2, userId),
      code,
      0,
    );

    if (!res) {
      this.logger.error('set redis error, need reget this code', {
        res,
        code,
      });
    }

    return code;
  }

  async getDetailByCode(code: string): Promise<string> {
    return cache.get(
      RedisKeys.CODE_TICKET_MAPPING.replace(
        RedisReplaceKeys.CODE_TICKET_MAPPING,
        code,
      ),
    );
  }

  async getInfoByCode(code: string) {
    return this.ticketCodeModel.findOne({
      code,
    });
  }
}
