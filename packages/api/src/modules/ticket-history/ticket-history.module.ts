import { Module, forwardRef } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';
import { TicketHistoryController } from './ticket-history.controller';
import { TicketCodeModule } from '@/modules/ticket-code/ticket-code.module';

@Module({
  imports: [forwardRef(() => TicketCodeModule)],
  controllers: [TicketHistoryController],
  providers: [TicketHistoryService],
  exports: [TicketHistoryService],
})
export class TicketHistoryModule {}
