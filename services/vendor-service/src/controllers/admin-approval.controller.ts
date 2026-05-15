import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { AdminApprovalDecisionSchema, VendorListQuerySchema } from '@repo/validators';

import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { RequireRole, RoleGuard } from '../decorators/index.js';
import { VendorService } from '../services/vendor.service.js';
import { mapVendorToResponse } from './mappers/vendor-response.mapper.js';

/**
 * Note: `AdminApprovalDecisionSchema` is a discriminated union, which
 * `createZodDto` cannot represent as a class (TS 2509). The decide
 * endpoint parses the raw body via `AdminApprovalDecisionSchema.parse`
 * instead — the global `ZodValidationPipe` skips bodies typed as
 * `unknown` so the manual parse owns validation. Kubb OpenAPI gen
 * picks the schema up via the `@repo/validators` barrel.
 */
export class AdminVendorListQueryDto extends createZodDto(VendorListQuerySchema) {}

/**
 * Admin-only vendor-approval queue. The hard gate per D8 + D25 (Q4
 * user answer = admin approval required for every vendor at MVP).
 */
@Controller('admin/vendor-approvals')
@UseGuards(RoleGuard)
@RequireRole('admin')
export class AdminApprovalController {
  constructor(private readonly vendorService: VendorService) {}

  /**
   * List vendors awaiting admin review (defaults to `PENDING_REVIEW`).
   */
  @Get()
  async list(@Query() query: AdminVendorListQueryDto): Promise<{
    items: ReturnType<typeof mapVendorToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.vendorService.list({
      status: query.status ?? 'PENDING_REVIEW',
      tier: query.tier,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map(mapVendorToResponse),
      pagination: result.pagination,
    };
  }

  @Get(':id')
  async getDetail(@Param('id') id: string): Promise<ReturnType<typeof mapVendorToResponse>> {
    const vendor = await this.vendorService.getById(id);
    return mapVendorToResponse(vendor);
  }

  /**
   * Approve or reject a vendor application. Decision body:
   *
   *   { decision: 'approve', notes?: string }
   *   { decision: 'reject',  reason: string }
   */
  @Post(':id/decision')
  async decide(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() raw: unknown,
  ): Promise<ReturnType<typeof mapVendorToResponse>> {
    const parsed = AdminApprovalDecisionSchema.parse(raw);
    if (parsed.decision === 'approve') {
      const vendor = await this.vendorService.approve({
        vendorId: id,
        approvedBy: user.id,
        notes: parsed.notes,
      });
      return mapVendorToResponse(vendor);
    }
    const vendor = await this.vendorService.reject({
      vendorId: id,
      rejectedBy: user.id,
      reason: parsed.reason,
    });
    return mapVendorToResponse(vendor);
  }

  /**
   * Sugar — POST /api/admin/vendor-approvals/:id/approve with empty body.
   */
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { notes?: string } = {},
  ): Promise<ReturnType<typeof mapVendorToResponse>> {
    const vendor = await this.vendorService.approve({
      vendorId: id,
      approvedBy: user.id,
      notes: body.notes,
    });
    return mapVendorToResponse(vendor);
  }
}
