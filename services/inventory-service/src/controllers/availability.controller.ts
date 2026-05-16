import { Body, Controller, Post } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { BatchAvailabilityQuerySchema } from '@repo/validators';

import { AvailabilityService } from '../services/availability.service.js';

export class BatchAvailabilityQueryDto extends createZodDto(BatchAvailabilityQuerySchema) {}

@Controller('inventory/availability')
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Post()
  async batch(@Body() body: BatchAvailabilityQueryDto): Promise<Record<string, unknown>> {
    return this.availability.batchGetByWarehouse(body.variantIds);
  }
}
