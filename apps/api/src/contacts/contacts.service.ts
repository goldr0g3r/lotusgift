import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { status?: string }) {
    const where: Record<string, unknown> = {};
    if (params.status) where.status = params.status;
    return this.prisma.contactInquiry.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const inquiry = await this.prisma.contactInquiry.findUnique({ where: { id } });
    if (!inquiry) throw new NotFoundException(`Inquiry #${id} not found`);
    return inquiry;
  }

  async create(dto: CreateContactDto) {
    return this.prisma.contactInquiry.create({ data: dto });
  }

  async update(id: string, dto: UpdateContactDto) {
    await this.findOne(id);
    return this.prisma.contactInquiry.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.contactInquiry.delete({ where: { id } });
  }
}
