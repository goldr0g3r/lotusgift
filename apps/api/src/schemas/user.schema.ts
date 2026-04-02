import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'user' })
export class User {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ required: true })
  name: string;

  @Prop()
  image?: string;

  @Prop()
  phone?: string;

  @Prop()
  company?: string;

  @Prop({ default: 'client' })
  role?: string;

  @Prop()
  banned?: boolean;

  @Prop()
  banReason?: string;

  @Prop()
  banExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });
