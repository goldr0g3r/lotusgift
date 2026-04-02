import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    search?: string;
    categoryId?: string;
    isWholesale?: string;
    isFeatured?: string;
    slug?: string;
  }) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { description: { contains: params.search } },
        { sku: { contains: params.search } },
      ];
    }

    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.isWholesale !== undefined) where.isWholesale = params.isWholesale === 'true';
    if (params.isFeatured !== undefined) where.isFeatured = params.isFeatured === 'true';
    if (params.slug) where.category = { slug: params.slug };

    return this.prisma.product.findMany({
      where,
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(params: { search?: string; categoryId?: string }) {
    const where: Prisma.ProductWhereInput = {};
    if (params.search) {
      where.OR = [
        { name: { contains: params.search } },
        { sku: { contains: params.search } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) throw new NotFoundException(`Product #${id} not found`);
    return product;
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: { category: true, images: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!product) throw new NotFoundException(`Product not found`);
    return product;
  }

  async create(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }
}
