import { SharedService } from './shared.service';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { MongooseModule } from '@nestjs/mongoose';
import * as schemas from '@/schemas';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from '@/common/filters/all-exception.filter';
import { ReponseTransformInterceptor } from '@/common/interceptors/reponse-transform.interceptor';

export const features = [];

Object.keys(schemas).forEach((v) => {
  const schema = schemas[v];
  if (schema['SCHEMA']) {
    features.push({ name: schema.name, schema: schema.SCHEMA });
  }
});

@Global()
@Module({
  imports: [
    /* 连接数据库 */
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        return {
          uri: configService.get<string>('database.uri'),
          useUnifiedTopology: true,
          useNewUrlParser: true,
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature(features),

    /* 连接redis */
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) =>
        configService.get<any>('redis'),
      inject: [ConfigService],
    }),

    /* 导入速率限制模块   ttl:单位秒钟， 表示ttl秒内最多只能请求 limit 次， 避免暴力攻击。*/
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 60,
    }),
  ],
  controllers: [],
  providers: [
    SharedService,
    //全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },

    //全局参数校验管道
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true, // 启用白名单，dto中没有声明的属性自动过滤
        transform: true, // 自动类型转换
      }),
    },

    //速率限制守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    /* 全局返回值转化拦截器 */
    {
      provide: APP_INTERCEPTOR,
      useClass: ReponseTransformInterceptor,
    },
  ],

  // TODO 为什么这里导出的features，其他模块不导入也能用？
  exports: [SharedService, MongooseModule.forFeature(features)],
})
export class SharedModule {}
