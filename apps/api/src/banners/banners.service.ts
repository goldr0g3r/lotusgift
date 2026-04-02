import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.banner.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({ data: dto });
  }

  async update(id: string, dto: UpdateBannerDto) {
    const existing = await this.prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Banner #${id} not found`);
    return this.prisma.banner.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }
}
