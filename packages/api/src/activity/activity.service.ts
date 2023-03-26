import { cache } from '@/lib/cache';
import { Activity } from '@/schemas/activity.schema';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ReturnModelType } from '@typegoose/typegoose';
import * as dayjs from 'dayjs';
import { LoggerEnum } from 'enums/enums';
import { RedisKeys } from 'enums/redisEnums';
import Redis from 'ioredis';

const CACHE_TIME_SEC = 120;

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(LoggerEnum.activity);

  constructor(
    @InjectRedis() private readonly redisService: Redis,
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
        this.logger.error(`cache act page ${i} list error`);
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
      RedisKeys.ACT_DETAIL_CACHE_KEY.replace('{actId}', actInfo['_id']),
      actInfo,
      CACHE_TIME_SEC,
      true,
    );
    if (!ret) {
      this.logger.error(`cache act info ${actInfo['_id']} list error`, actInfo);
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

  async getList(queryOption = {}, sort, limit = 0, offset = 0) {
    const collection = this.activityModel;
    let queryFun = collection.find(queryOption);

    if (sort) {
      queryFun = queryFun.sort();
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
}
