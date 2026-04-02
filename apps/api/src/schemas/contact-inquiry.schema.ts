import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContactInquiryDocument = HydratedDocument<ContactInquiry>;

export const INQUIRY_STATUSES = ['NEW', 'READ', 'REPLIED', 'CLOSED'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

@Schema({ timestamps: true, collection: 'contact_inquiries' })
export class ContactInquiry {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop()
  company?: string;

  @Prop()
  subject?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: INQUIRY_STATUSES, default: 'NEW' })
  status: InquiryStatus;

  @Prop()
  adminNote?: string;
}

export const ContactInquirySchema = SchemaFactory.createForClass(ContactInquiry);
ContactInquirySchema.set('toJSON', { virtuals: true });
ContactInquirySchema.set('toObject', { virtuals: true });
