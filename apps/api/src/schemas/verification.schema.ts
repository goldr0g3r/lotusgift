import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VerificationDocument = HydratedDocument<Verification>;

@Schema({ timestamps: true, collection: 'verification' })
export class Verification {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  identifier: string;

  @Prop({ required: true })
  value: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const VerificationSchema = SchemaFactory.createForClass(Verification);
VerificationSchema.set('toJSON', { virtuals: true });
VerificationSchema.set('toObject', { virtuals: true });
