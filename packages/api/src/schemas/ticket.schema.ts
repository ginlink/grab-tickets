import { buildSchema, Prop } from '@typegoose/typegoose';
import { Expose } from 'class-transformer';
import { BaseSchema } from './base.schema';
import { Activity } from './activity.schema';

export class Ticket extends BaseSchema {
  @Expose()
  @Prop()
  actId: string;

  @Expose()
  @Prop({
    ref: () => Activity,
    localField: 'actId',
    foreignField: '_id',
    justOne: true,
  })
  act: Activity;

  /**
   * 此时已建立一对多关系，那如何在 activity 中引用 ticket 呢？
   * @prop({ type: () => [Ticket], ref: () => Ticket })
   * tickets: Ref<Ticket>[];
   */

  @Expose()
  @Prop()
  name: string;

  @Expose()
  @Prop()
  desc: string;

  @Expose()
  @Prop()
  image: string;

  // 票的有效起始时间
  @Expose()
  @Prop({ type: Number })
  startTime: number;

  // 票的有效结束时间
  @Expose()
  @Prop({ type: Number })
  endTime: number;
}

Ticket.SCHEMA = buildSchema(Ticket);
