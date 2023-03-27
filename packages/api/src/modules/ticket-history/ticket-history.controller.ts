import { Controller } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';

@Controller('ticket-history')
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}
}
