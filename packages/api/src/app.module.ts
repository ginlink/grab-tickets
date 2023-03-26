import { SharedModule } from './shared/shared.module';
import { Module } from '@nestjs/common';
import configuration from './config/configuration';
import { ConfigModule } from '@nestjs/config';
import { ToolsModule } from './modules/tools/tools.module';
import { TicketCodeModule } from './modules/ticket-code/ticket-code.module';
import { TicketModule } from './ticket/ticket.module';
import { ActivityModule } from './activity/activity.module';

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
    ActivityModule,
    ToolsModule,
    TicketCodeModule,
    TicketModule,
  ],
})
export class AppModule {}
