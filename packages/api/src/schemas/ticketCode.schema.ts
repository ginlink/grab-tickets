import { buildSchema, Prop } from '@typegoose/typegoose';
import { BaseSchema } from './base.schema';
import { Ticket } from './ticket.schema';

export class TicketCode extends BaseSchema {
  @Prop({ unique: true })
  code: string;

  @Prop()
  ticketId: string;

  @Prop({
    ref: () => Ticket,
    localField: 'ticketId',
    foreignField: '_id',
    justOne: true,
  })
  ticket: Ticket;
}

TicketCode.SCHEMA = buildSchema(TicketCode);
