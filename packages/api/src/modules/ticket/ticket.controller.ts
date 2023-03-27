import { Controller, Get, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('get')
  get(@Query('actId') actId: string, @Query('userId') userId: string) {
    return this.ticketService.get(actId, userId);
  }
}
