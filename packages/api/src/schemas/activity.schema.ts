import { buildSchema, Prop } from '@typegoose/typegoose';
import { Expose } from 'class-transformer';
import { BaseSchema } from './base.schema';

export class Activity extends BaseSchema {
  @Expose()
  @Prop({ unique: true })
  aid: string;

  @Expose()
  @Prop()
  name: string;

  @Expose()
  @Prop()
  desc: string;

  @Expose()
  @Prop()
  image: string;

  @Expose()
  @Prop({ type: Number })
  startTime: number;

  @Expose()
  @Prop({ type: Number })
  endTime: number;
}

Activity.SCHEMA = buildSchema(Activity);
