import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  AdminReviewListQuerySchema,
  ReviewModerationDecisionRequestSchema,
} from '@repo/validators';

import { ReviewService } from '../services/review.service.js';
import { RequireRole, RoleGuard } from '../decorators/index.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { mapReviewToResponse } from './mappers/review-response.mapper.js';

export class AdminReviewListQueryDto extends createZodDto(AdminReviewListQuerySchema) {}

/**
 * Admin product-review moderation queue. Gated globally by
 * `RoleGuard` + `@RequireRole('admin')` per D10.
 *
 * Note: `ReviewModerationDecisionRequestSchema` is a discriminated
 * union; `createZodDto` can't represent that (TS 2509 per P6 lesson #2).
 * We parse the body manually inside the decision endpoint.
 */
@Controller('admin/product-reviews')
@UseGuards(RoleGuard)
@RequireRole('admin')
export class AdminReviewController {
  constructor(private readonly reviews: ReviewService) {}

  @Get()
  async list(@Query() query: AdminReviewListQueryDto): Promise<{
    items: ReturnType<typeof mapReviewToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.reviews.listForAdmin({
      status: query.status,
      productId: query.productId,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map(mapReviewToResponse),
      pagination: result.pagination,
    };
  }

  @Post(':id/decision')
  async decide(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() raw: unknown,
  ): Promise<ReturnType<typeof mapReviewToResponse>> {
    const parsed = ReviewModerationDecisionRequestSchema.parse(raw);
    if (parsed.action === 'approve') {
      const review = await this.reviews.approve({ reviewId: id, adminId: user.id });
      return mapReviewToResponse(review);
    }
    const review = await this.reviews.reject({
      reviewId: id,
      adminId: user.id,
      reason: parsed.reason,
    });
    return mapReviewToResponse(review);
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapReviewToResponse>> {
    const review = await this.reviews.approve({ reviewId: id, adminId: user.id });
    return mapReviewToResponse(review);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapReviewToResponse>> {
    const review = await this.reviews.reject({
      reviewId: id,
      adminId: user.id,
      reason: body.reason,
    });
    return mapReviewToResponse(review);
  }
}
