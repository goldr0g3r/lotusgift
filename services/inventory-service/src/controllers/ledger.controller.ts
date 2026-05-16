import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { LedgerListQuerySchema } from '@repo/validators';
import { RequireRole, RoleGuard } from '@lotusgift/vendor-service';

import { LedgerService } from '../services/ledger.service.js';
import { WarehouseOwnershipGuard } from '../decorators/index.js';

export class LedgerListQueryDto extends createZodDto(LedgerListQuerySchema) {}

@Controller('inventory/ledger')
@UseGuards(RoleGuard)
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Get()
  @RequireRole('admin', 'warehouse-manager')
  @UseGuards(WarehouseOwnershipGuard)
  async list(@Query() query: LedgerListQueryDto): Promise<{
    items: unknown[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.ledger.list({
      variantId: query.variantId,
      warehouseId: query.warehouseId,
      vendorId: query.vendorId,
      reason: query.reason,
      since: query.since,
      until: query.until,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map((row) => ({
        id: row.id,
        variantId: row.variantId,
        warehouseId: row.warehouseId,
        delta: row.delta,
        reason: row.reason,
        ledgerSeq: row.ledgerSeq,
        createdAt: (row as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit) || 0,
      },
    };
  }
}
