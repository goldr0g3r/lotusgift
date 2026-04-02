import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ClientDocument = HydratedDocument<Client>;

@Schema({ timestamps: true, collection: 'clients' })
export class Client {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  companyName: string;

  @Prop({ required: true })
  contactName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  notes?: string;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
ClientSchema.set('toJSON', { virtuals: true });
ClientSchema.set('toObject', { virtuals: true });
