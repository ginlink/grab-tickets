import { Module, forwardRef } from '@nestjs/common';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';
import { ActivityModule } from '@/modules/activity/activity.module';
import { TicketCodeModule } from '../ticket-code/ticket-code.module';

@Module({
  imports: [
    forwardRef(() => ActivityModule),
    forwardRef(() => TicketCodeModule),
  ],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule {}
