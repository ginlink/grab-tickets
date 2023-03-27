import { Controller, Get, Query } from '@nestjs/common';
import { TicketHistoryService } from './ticket-history.service';
import { DataObj } from '@/common/class/data-obj.class';

@Controller('ticket-history')
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}

  @Get('list')
  async list(@Query() filter: any) {
    const data = await this.ticketHistoryService.list(filter);
    return DataObj.create(data);
  }
}
