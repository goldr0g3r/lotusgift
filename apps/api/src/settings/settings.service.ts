import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SiteSetting, SiteSettingDocument } from '../schemas';

@Injectable()
export class SettingsService {
  constructor(@InjectModel(SiteSetting.name) private settingModel: Model<SiteSettingDocument>) {}

  async getAll() {
    const settings = await this.settingModel.find();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  }

  async get(key: string) {
    const setting = await this.settingModel.findOne({ key });
    return setting?.value || null;
  }

  async set(key: string, value: string) {
    return this.settingModel.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true },
    );
  }

  async bulkUpdate(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.settingModel.findOneAndUpdate(
        { key },
        { key, value },
        { upsert: true, new: true },
      ),
    );
    await Promise.all(operations);
    return this.getAll();
  }
}
