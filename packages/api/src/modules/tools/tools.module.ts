import { Module } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { ActivityModule } from '@/activity/activity.module';
import { TicketCodeModule } from '../ticket-code/ticket-code.module';

@Module({
  imports: [ActivityModule, TicketCodeModule],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
