import { Module, forwardRef } from '@nestjs/common';
import { TicketCodeService } from './ticket-code.service';
import { TicketCodeController } from './ticket-code.controller';
import { TicketModule } from '../ticket/ticket.module';

@Module({
  imports: [forwardRef(() => TicketModule)],
  controllers: [TicketCodeController],
  providers: [TicketCodeService],
  exports: [TicketCodeService],
})
export class TicketCodeModule {}
