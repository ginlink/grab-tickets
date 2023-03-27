import { Body, Controller, Get, Param, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { DataObj } from '@/common/class/data-obj.class';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('get')
  async get(@Query('aid') aid: string, @Query('userId') userId: string) {
    const data = await this.ticketService.get(aid, userId);
    return DataObj.create(data);
  }

  @Get('detail/:id')
  async getDetailById(@Param('id') id: string) {
    const data = await this.ticketService.getDetailById(id);
    return DataObj.create(data);
  }

  @Get('list')
  async list(@Query() filter: any) {
    const data = await this.ticketService.list(filter);
    return DataObj.create(data);
  }
}
