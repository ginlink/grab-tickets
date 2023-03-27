import { buildSchema, Prop } from '@typegoose/typegoose';
import { BaseSchema } from './base.schema';
import { Activity } from './activity.schema';

export class Ticket extends BaseSchema {
  @Prop()
  activityId: string;

  @Prop({
    ref: () => Activity,
    localField: 'activityId',
    foreignField: '_id',
    justOne: true,
  })
  activity: Activity;

  /**
   * 此时已建立一对多关系，那如何在 activity 中引用 ticket 呢？
   * @prop({ type: () => [Ticket], ref: () => Ticket })
   * tickets: Ref<Ticket>[];
   */

  @Prop()
  name: string;

  @Prop()
  desc: string;

  @Prop()
  image: string;

  // 票的有效起始时间
  @Prop({ type: Number })
  startTime: number;

  // 票的有效结束时间
  @Prop({ type: Number })
  endTime: number;
}

Ticket.SCHEMA = buildSchema(Ticket);
