import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial, TestimonialDocument } from '../schemas';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(@InjectModel(Testimonial.name) private testimonialModel: Model<TestimonialDocument>) {}

  async findAll(activeOnly = false) {
    const filter = activeOnly ? { isActive: true } : {};
    return this.testimonialModel.find(filter).sort({ sortOrder: 1 });
  }

  async create(dto: CreateTestimonialDto) {
    return this.testimonialModel.create(dto);
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const existing = await this.testimonialModel.findById(id);
    if (!existing) throw new NotFoundException(`Testimonial #${id} not found`);
    return this.testimonialModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async remove(id: string) {
    return this.testimonialModel.findByIdAndDelete(id);
  }
}
