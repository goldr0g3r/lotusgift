import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ timestamps: true, collection: 'session' })
export class Session {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ required: true })
  userId: string;

  @Prop()
  impersonatedBy?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.set('toJSON', { virtuals: true });
SessionSchema.set('toObject', { virtuals: true });
