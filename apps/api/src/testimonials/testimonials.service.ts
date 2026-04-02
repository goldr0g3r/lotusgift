import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(activeOnly = false) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.testimonial.findMany({ where, orderBy: { sortOrder: 'asc' } });
  }

  async create(dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({ data: dto });
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const existing = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Testimonial #${id} not found`);
    return this.prisma.testimonial.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.testimonial.delete({ where: { id } });
  }
}
