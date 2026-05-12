import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SiteSetting, SiteSettingSchema } from '../schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: SiteSetting.name, schema: SiteSettingSchema }])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
