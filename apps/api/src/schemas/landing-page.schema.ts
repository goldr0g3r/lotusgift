import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LandingPageDocument = HydratedDocument<LandingPage>;

@Schema({ timestamps: true, collection: 'landing_pages' })
export class LandingPage {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  heading: string;

  @Prop()
  subheading?: string;

  @Prop()
  content?: string;

  @Prop()
  ctaText?: string;

  @Prop()
  ctaLink?: string;

  @Prop()
  imageUrl?: string;

  @Prop()
  metaTitle?: string;

  @Prop()
  metaDesc?: string;

  @Prop()
  utmSource?: string;

  @Prop()
  utmMedium?: string;

  @Prop()
  utmCampaign?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const LandingPageSchema = SchemaFactory.createForClass(LandingPage);
LandingPageSchema.set('toJSON', { virtuals: true });
LandingPageSchema.set('toObject', { virtuals: true });
