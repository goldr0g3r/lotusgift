import { Controller, Get, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { VendorOwnershipGuard } from '../decorators/index.js';
import { PayoutService } from '../services/payout.service.js';

/** Pagination query DTO with safe bounds (page≥1, limit 1-100). */
export class PayoutListQueryDto extends createZodDto(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
) {}

/**
 * Vendor payout READ-ONLY endpoints. Ownership-gated: only the vendor's
 * active organization (or admin role) can read payouts. Always returns
 * an empty list at MVP until P10 payment-service ships the writer.
 */
@Controller('vendors/:id/payouts')
@UseGuards(VendorOwnershipGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get()
  async list(
    @Param('id') vendorId: string,
    @Query() query: PayoutListQueryDto,
  ): Promise<{
    items: ReturnType<typeof mapPayoutRow>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.payoutService.listByVendor({
      vendorId,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map(mapPayoutRow),
      pagination: result.pagination,
    };
  }

  @Get('current-period')
  async getCurrentPeriod(@Param('id') vendorId: string): Promise<{
    vendorId: string;
    periodStart: string;
    periodEnd: string;
    estimatedGrossPaise: number;
    estimatedCommissionPaise: number;
    estimatedNetPaise: number;
  }> {
    return this.payoutService.getCurrentPeriodTotals(vendorId);
  }

  @Get(':payoutId')
  async getById(
    @Param('id') vendorId: string,
    @Param('payoutId') payoutId: string,
  ): Promise<ReturnType<typeof mapPayoutRow>> {
    const row = await this.payoutService.getById(payoutId);
    if (!row || row.vendorId !== vendorId) {
      throw new NotFoundException({
        message: `Payout ${payoutId} not found for vendor ${vendorId}`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return mapPayoutRow(row);
  }
}

function mapPayoutRow(row: import('../schemas/payout.schema.js').PayoutDocument): {
  id: string;
  vendorId: string;
  periodStart: string;
  periodEnd: string;
  grossPaise: number;
  commissionPaise: number;
  netPaise: number;
  status: string;
  razorpayPayoutId: string | null;
  createdAt: string;
} {
  return {
    id: row.id as unknown as string,
    vendorId: row.vendorId,
    periodStart: row.periodStart.toISOString(),
    periodEnd: row.periodEnd.toISOString(),
    grossPaise: row.grossPaise,
    commissionPaise: row.commissionPaise,
    netPaise: row.netPaise,
    status: row.status,
    razorpayPayoutId: row.razorpayPayoutId,
    createdAt: row.createdAt.toISOString(),
  };
}
