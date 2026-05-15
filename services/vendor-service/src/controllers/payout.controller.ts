import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';

import { PayoutService } from '../services/payout.service.js';

/**
 * Vendor payout READ-ONLY endpoints. Always returns an empty list at
 * MVP until P10 payment-service ships the writer.
 */
@Controller('vendors/:id/payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get()
  async list(
    @Param('id') vendorId: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ): Promise<{
    items: ReturnType<typeof mapPayoutRow>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.payoutService.listByVendor({
      vendorId,
      page: pageRaw ? Number(pageRaw) : undefined,
      limit: limitRaw ? Number(limitRaw) : undefined,
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
