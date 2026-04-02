import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from '../schemas';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(@InjectModel(Banner.name) private bannerModel: Model<BannerDocument>) {}

  async findAll(activeOnly = false) {
    const filter = activeOnly ? { isActive: true } : {};
    return this.bannerModel.find(filter).sort({ sortOrder: 1 });
  }

  async create(dto: CreateBannerDto) {
    return this.bannerModel.create(dto);
  }

  async update(id: string, dto: UpdateBannerDto) {
    const existing = await this.bannerModel.findById(id);
    if (!existing) throw new NotFoundException(`Banner #${id} not found`);
    return this.bannerModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    return this.bannerModel.findByIdAndDelete(id);
  }
}
