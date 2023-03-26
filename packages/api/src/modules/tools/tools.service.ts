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

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(LoggerEnum.tools);

  constructor(
    @InjectRedis() private readonly redisService: Redis,
    @InjectModel(User.name)
    private readonly userModel: ReturnModelType<typeof User>,
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
}
