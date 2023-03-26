import { SharedModule } from './shared/shared.module';
import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from './modules/tools/tools.module';

@Module({
  imports: [
    /* 配置文件模块 */
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    /* 公共模块 */
    SharedModule,

    /* 业务模块 */
    ToolsModule,
  ],
})
export class AppModule {}
