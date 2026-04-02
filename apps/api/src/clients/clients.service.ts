import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { search?: string }) {
    const where: Prisma.ClientWhereInput = {};

    if (params.search) {
      where.OR = [
        { companyName: { contains: params.search } },
        { email: { contains: params.search } },
        { contactName: { contains: params.search } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: { quotes: { select: { id: true, quoteNumber: true, status: true, total: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { quotes: true },
    });
    if (!client) throw new NotFoundException(`Client #${id} not found`);
    return client;
  }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({ data: dto });
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id);
    return this.prisma.client.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({ where: { id } });
  }
}
