import { Controller } from '@nestjs/common';
import { TicketCodeService } from './ticket-code.service';

@Controller('ticket-code')
export class TicketCodeController {
  constructor(private readonly ticketCodeService: TicketCodeService) {}
}
