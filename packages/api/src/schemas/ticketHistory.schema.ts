import { buildSchema, Prop } from '@typegoose/typegoose';
import { Expose } from 'class-transformer';
import { BaseSchema } from './base.schema';
import { User } from './user.schema';
import { TicketCode } from './ticketCode.schema';

export class TicketHistory extends BaseSchema {
  @Expose()
  @Prop()
  userId: string;

  @Expose()
  @Prop({
    ref: () => User,
    localField: 'userId',
    foreignField: '_id',
    justOne: true,
  })
  user: User;

  @Expose()
  @Prop()
  codeId: string;

  @Expose()
  @Prop({
    ref: () => TicketCode,
    localField: 'codeId',
    foreignField: 'code',
    justOne: true,
  })
  ticket: TicketCode;

  // 券码获得时间
  @Expose()
  @Prop({ type: Number })
  time: number;
}

TicketHistory.SCHEMA = buildSchema(TicketHistory);
