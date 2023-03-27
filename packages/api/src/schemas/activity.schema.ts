import { buildSchema, Prop } from '@typegoose/typegoose';
import { BaseSchema } from './base.schema';

export class Activity extends BaseSchema {
  @Prop({ unique: true })
  aid: string;

  @Prop()
  name: string;

  @Prop()
  desc: string;

  @Prop()
  image: string;

  @Prop({ type: Number })
  startTime: number;

  @Prop({ type: Number })
  endTime: number;
}

Activity.SCHEMA = buildSchema(Activity);
