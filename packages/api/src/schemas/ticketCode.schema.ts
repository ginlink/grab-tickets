import { buildSchema, Prop } from '@typegoose/typegoose';
import { Expose } from 'class-transformer';
import { BaseSchema } from './base.schema';
import { Ticket } from './ticket.schema';

export class TicketCode extends BaseSchema {
  @Expose()
  @Prop({ unique: true })
  code: string;

  @Expose()
  @Prop()
  ticketId: string;

  @Expose()
  @Prop({
    ref: () => Ticket,
    localField: 'ticketId',
    foreignField: '_id',
    justOne: true,
  })
  ticket: Ticket;
}

TicketCode.SCHEMA = buildSchema(TicketCode);
