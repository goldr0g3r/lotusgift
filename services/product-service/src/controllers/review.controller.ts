import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  PageQuerySchema,
  ReviewCreateRequestSchema,
} from '@repo/validators';

import { ReviewService } from '../services/review.service.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { mapReviewToResponse } from './mappers/review-response.mapper.js';

export class ReviewCreateRequestDto extends createZodDto(ReviewCreateRequestSchema) {}
export class ReviewPageQueryDto extends createZodDto(PageQuerySchema) {}

/**
 * Public review read + authenticated-buyer create endpoints. The
 * admin moderation queue lives on `AdminReviewController` (separately
 * gated by @RequireRole('admin') + RoleGuard).
 */
@Controller('products/:productId/reviews')
export class ReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  async list(
    @Param('productId') productId: string,
    @Query() query: ReviewPageQueryDto,
  ): Promise<{
    items: ReturnType<typeof mapReviewToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.reviews.listPublicForProduct({
      productId,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map(mapReviewToResponse),
      pagination: result.pagination,
    };
  }

  @Post()
  async create(
    @Param('productId') productId: string,
    @Body() body: ReviewCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapReviewToResponse>> {
    const review = await this.reviews.create({
      productId,
      buyerId: user.id,
      payload: body as unknown as Parameters<ReviewService['create']>[0]['payload'],
    });
    return mapReviewToResponse(review);
  }
}
