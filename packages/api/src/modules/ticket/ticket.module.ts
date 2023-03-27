import { Module, forwardRef } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { ActivityModule } from '@/modules/activity/activity.module';
import { TicketCodeModule } from '@/modules/ticket-code/ticket-code.module';
import { TicketHistoryModule } from '@/modules/ticket-history/ticket-history.module';

@Module({
  imports: [
    // forwardRef(() => TicketHistoryModule),
    // forwardRef(() => ActivityModule),
    // forwardRef(() => TicketCodeModule),

    TicketCodeModule,
    ActivityModule,
    TicketHistoryModule,
  ],
  controllers: [TicketController],
  providers: [TicketService],
  exports: [TicketService],
})
export class TicketModule {}
