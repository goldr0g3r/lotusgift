import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TestimonialDocument = HydratedDocument<Testimonial>;

@Schema({ collection: 'testimonials' })
export class Testimonial {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  clientName: string;

  @Prop()
  company?: string;

  @Prop({ required: true })
  content: string;

  @Prop({ default: 5 })
  rating: number;

  @Prop()
  imageUrl?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: () => new Date() })
  createdAt: Date;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
TestimonialSchema.set('toJSON', { virtuals: true });
TestimonialSchema.set('toObject', { virtuals: true });
