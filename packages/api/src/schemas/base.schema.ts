import { getClass, modelOptions, Prop, Severity } from '@typegoose/typegoose';
import { IModelOptions } from '@typegoose/typegoose/lib/types';
import {
  Exclude,
  Expose,
  instanceToPlain,
  plainToInstance,
} from 'class-transformer';
import { Schema } from 'mongoose';

export function defaultModelOptions(collectionName?: string): IModelOptions {
  return {
    schemaOptions: {
      collection: collectionName,
      timestamps: true,
      toJSON: {
        virtuals: true,
        getters: true,
        versionKey: false,
        transform: (doc, ret) =>
          instanceToPlain(plainToInstance(getClass(doc) as any, ret)),
      },
      toObject: { virtuals: true },
      id: true,
      _id: true,
    },
    options: {
      allowMixed: Severity.ALLOW,
    },
  };
}

@modelOptions(defaultModelOptions())
export class BaseSchema {
  public static SCHEMA = null;
  @Exclude()
  @Prop({ type: Schema.Types.ObjectId, auto: true })
  _id: string;

  @Expose()
  @Prop({ type: Number })
  createdAt: number;

  @Expose()
  @Prop({ type: Number })
  updatedAt: number;

  @Expose()
  get id(): BaseSchema['_id'] {
    return this._id;
  }

  set id(newId) {
    this._id = newId;
  }
}

@modelOptions({
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      getters: true,
      versionKey: false,
      transform: (doc, ret) =>
        instanceToPlain(plainToInstance(getClass(doc) as any, ret)),
    },
    toObject: { virtuals: true },
    id: true,
    _id: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class BaseAutoIncrementIDSchema {
  public static SCHEMA = null;
  @Prop()
  _id: number;

  get id(): BaseAutoIncrementIDSchema['_id'] {
    return this._id;
  }

  set id(newId) {
    this._id = newId;
  }

  @Expose()
  @Prop({ type: Number })
  createdAt: number;

  @Expose()
  @Prop({ type: Number })
  updatedAt: number;
}
