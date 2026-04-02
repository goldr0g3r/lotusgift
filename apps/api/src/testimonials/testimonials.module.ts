import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TestimonialsController } from './testimonials.controller';
import { TestimonialsService } from './testimonials.service';
import { Testimonial, TestimonialSchema } from '../schemas';

@Module({
  imports: [MongooseModule.forFeature([{ name: Testimonial.name, schema: TestimonialSchema }])],
  controllers: [TestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
