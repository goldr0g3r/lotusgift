import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    const settings = await this.prisma.siteSetting.findMany();
    return settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {} as Record<string, string>);
  }

  async get(key: string) {
    const setting = await this.prisma.siteSetting.findUnique({ where: { key } });
    return setting?.value || null;
  }

  async set(key: string, value: string) {
    return this.prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async bulkUpdate(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) =>
      this.prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    );
    await Promise.all(operations);
    return this.getAll();
  }
}
