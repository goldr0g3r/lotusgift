import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true, collection: 'account' })
export class Account {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  accountId: string;

  @Prop({ required: true })
  providerId: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  accessToken?: string;

  @Prop()
  refreshToken?: string;

  @Prop()
  idToken?: string;

  @Prop()
  accessTokenExpiresAt?: Date;

  @Prop()
  refreshTokenExpiresAt?: Date;

  @Prop()
  scope?: string;

  @Prop()
  password?: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
AccountSchema.set('toJSON', { virtuals: true });
AccountSchema.set('toObject', { virtuals: true });
