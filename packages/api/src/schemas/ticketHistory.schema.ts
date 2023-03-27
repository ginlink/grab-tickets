import { buildSchema, Prop } from '@typegoose/typegoose';
import { BaseSchema } from './base.schema';
import { User } from './user.schema';
import { TicketCode } from './ticketCode.schema';

export class TicketHistory extends BaseSchema {
  @Prop()
  userId: string;

  @Prop({
    ref: () => User,
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
  })
  user: User;

  @Prop()
  codeId: string;

  @Prop({
    ref: () => TicketCode,
    localField: 'codeId',
    foreignField: 'code',
    justOne: true,
  })
  ticket: TicketCode;

  // 券码获得时间
  @Prop({ type: Number })
  time: number;
}

TicketHistory.SCHEMA = buildSchema(TicketHistory);
