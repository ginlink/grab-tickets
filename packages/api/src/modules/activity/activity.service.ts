import { cache } from '@/lib/cache';
import { TicketCodeService } from '@/modules/ticket-code/ticket-code.service';
import { Activity } from '@/schemas/activity.schema';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import * as dayjs from 'dayjs';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys, RedisReplaceKeys } from 'enums/redisEnums';
import Redis from 'ioredis';

const CACHE_TIME_SEC = 120;

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(LoggerEnum.activity);

  constructor(
    @Inject(forwardRef(() => TicketCodeService))
    private readonly ticketCodeService: TicketCodeService,
    @InjectRedis() redisService: Redis,
    @InjectModel(Activity.name)
    private readonly activityModel: ReturnModelType<typeof Activity>,
  ) {
    cache.setClient(redisService);
  }

  async cacheList(cacheSize = 5) {
    let allResult = true;

    if (cacheSize < 0) {
      return allResult;
    }
    for (let i = 0; i < cacheSize; i++) {
      // 分页获取数据并缓存，由于是离线服务，可以不需要考虑性能问题
      const actList = await this.getOnlineList(i);
      if (!actList || actList.length < 1) {
        return allResult;
      }
      actList.forEach(async (actInfo) => {
        await this.cacheDetail(actInfo);
      });
      const ret = await cache.set(
        RedisKeys.ACT_LIST_CACHE_KEY.replace('{page}', String(i)),
        JSON.stringify(actList),
        CACHE_TIME_SEC,
      );
      if (!ret) {
        this.logger.error(`cache activity page ${i} list error`);
      }
      allResult = allResult && ret;
    }
    return allResult;
  }

  async cacheDetail(actInfo) {
    if (!actInfo) {
      return;
    }
    const ret = await cache.set(
      RedisKeys.ACT_DETAIL_CACHE_KEY.replace('{activityId}', actInfo['_id']),
      actInfo,
      CACHE_TIME_SEC,
      true,
    );
    if (!ret) {
      this.logger.error(
        `cache activity info ${actInfo['_id']} list error`,
        actInfo,
      );
    }
  }

  async getOnlineList(page = 0, pageSize = 20) {
    const currentTimestamp = dayjs().unix();
    const queryOption = {
      startTime: {
        $lt: currentTimestamp,
      },
      endTime: {
        $gt: currentTimestamp,
      },
    };

    return await this.getList(
      queryOption,
      { startTime: -1 },
      pageSize,
      page * pageSize,
    );
  }

  async getList(queryOption = {}, sort: any, limit = 0, offset = 0) {
    const collection = this.activityModel;
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

  async checkEnable(aid: string, userId: string) {
    if (!aid) {
      throw new Error('Invalid activity id');
    }

    if (!userId) {
      throw new Error('Invalid user id');
    }

    const activity = await this.getDetail(aid);
    if (!activity) {
      throw new Error('Invalid activity id');
    }

    const code = await this.ticketCodeService.getUserJoinCode(aid, userId);
    if (code) {
      throw new Error('Repeat participation');
    }

    return true;
  }

  async getDetail(aid: string) {
    let detail = await cache.get(
      RedisKeys.ACT_DETAIL_CACHE_KEY.replace(
        RedisReplaceKeys.ACT_DETAIL_CACHE_KEY,
        aid,
      ),
    );

    if (detail) {
      return detail;
    }

    detail = await this.activityModel.findOne({ aid });

    if (detail) {
      this.cacheDetail(detail);
    }

    return detail;
  }

  async list(filter: any) {
    // eslint-disable-next-line prefer-const
    let { page, pageSize, sort, ...rest } = filter;

    page = page ? page - 1 : 0;
    pageSize = pageSize || 20;

    const list = await this.getList(rest, sort, pageSize, page * pageSize);
    const total = await this.activityModel.countDocuments(rest);
    return { list, total };
  }
}
