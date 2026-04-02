import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SiteSettingDocument = HydratedDocument<SiteSetting>;

@Schema({ collection: 'site_settings' })
export class SiteSetting {
  @Prop({ type: String, default: () => new Types.ObjectId().toHexString() })
  _id: string;

  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;
}

export const SiteSettingSchema = SchemaFactory.createForClass(SiteSetting);
SiteSettingSchema.set('toJSON', { virtuals: true });
SiteSettingSchema.set('toObject', { virtuals: true });
