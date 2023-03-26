import * as NodeCache from 'node-cache';
import Redis from 'ioredis';

class Cache {
  localCacheEnable: boolean;
  redisEnable: boolean;
  myCache?: NodeCache;
  client?: Redis;

  constructor(localCacheEnable = true, redisEnable = true, client?: Redis) {
    this.localCacheEnable = localCacheEnable;
    this.redisEnable = redisEnable;
    if (localCacheEnable) {
      this.myCache = new NodeCache();
    }

    if (redisEnable) {
      this.client = client;
    }
  }

  setClient(client?: Redis) {
    this.client = client;
  }

  /**
   *
   * @description 获取缓存信息
   * @param {string} key
   */
  async get<T = any>(key): Promise<T | null> {
    let value;
    if (this.localCacheEnable) {
      value = this.myCache.get(key);
    }
    if (!value && this.redisEnable) {
      if (!this.client) {
        return null;
      }
      try {
        value = await this.client.get(key);
      } catch (err) {
        console.log(err);
      }
    }
    try {
      value = JSON.parse(value);
    } catch (error) {
      return value;
    }
    return value;
  }

  /**
   *
   * @description 保存缓存信息
   * @param {string} key 缓存key
   * @param {string} value 缓存值
   * @param {int} expire 过期时间/秒
   * @param {boolean} cacheLocal 是否本地缓存
   */
  async set<T extends string | number | Buffer = any>(
    key: string,
    value: T,
    expire = 10,
    cacheLocal = false,
  ) {
    let localCacheRet, redisRet;

    const fmtValue = typeof value == 'object' ? JSON.stringify(value) : value;

    if (this.localCacheEnable && cacheLocal) {
      localCacheRet = this.myCache.set(key, fmtValue, expire);
    }
    if (this.redisEnable) {
      if (!this.client) {
        return false;
      }
      try {
        if (expire == 0 || expire < 0) {
          redisRet = await this.client.set(key, fmtValue);
        } else {
          redisRet = await this.client.set(key, fmtValue, 'EX', expire);
        }
      } catch (err) {
        console.log(err);
      }
    }
    return localCacheRet || redisRet;
  }

  getRedis() {
    if (!this.redisEnable) {
      return null;
    }
    return this.client;
  }
}

export const cache = new Cache(true, true);
