import { buildSchema, Prop } from '@typegoose/typegoose';
import { Exclude } from 'class-transformer';
import { BaseSchema } from './base.schema';
import { encryptPassword } from '@/utils';

export const DefaultUser: Partial<User> = {
  username: 'test用户',
  password: encryptPassword('test12311'),
};

export class User extends BaseSchema {
  @Prop({ unique: false })
  username: string;

  @Exclude()
  @Prop()
  password: string;
}

User.SCHEMA = buildSchema(User);
