import { Controller, ForbiddenException, Get, Inject, NotFoundException, Param, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { CurrentUser, type CurrentUserPayload, Session, type SessionPayload } from '../session.types.js';
import { SlaScoringService } from '../services/sla-scoring.service.js';
import { WarehouseService } from '../services/warehouse.service.js';

/** Optional days-window query (1-90 bounds). */
export class SlaScoreQueryDto extends createZodDto(
  z.object({
    days: z.coerce.number().int().min(1).max(90).default(7),
  }),
) {}

/**
 * Per-warehouse SLA score READ-ONLY endpoint. Returns an empty array at
 * MVP until P21 observability cron lands. Ownership check happens
 * inline because the path parameter is `warehouseId` (not `vendorId`)
 * — the standard `VendorOwnershipGuard` keys on the vendor id directly.
 */
@Controller('warehouses/:warehouseId/sla-score')
export class SlaScoreController {
  constructor(
    private readonly slaService: SlaScoringService,
    @Inject(WarehouseService) private readonly warehouseService: WarehouseService,
  ) {}

  @Get()
  async getByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Session() session: SessionPayload,
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: SlaScoreQueryDto,
  ): Promise<{
    warehouseId: string;
    windowDays: number;
    rows: ReturnType<typeof mapRow>[];
  }> {
    // Ownership check: resolve the warehouse → its vendor → its org;
    // verify the session's active org matches OR the user has admin role.
    const warehouse = await this.warehouseService.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException({
        message: `Warehouse ${warehouseId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    const roles: string[] = [];
    if (typeof user.role === 'string') roles.push(user.role);
    if (Array.isArray(user.roles)) roles.push(...user.roles);
    const isAdmin = roles.includes('admin');
    if (!isAdmin && warehouse.orgId !== session.activeOrganizationId) {
      throw new ForbiddenException({
        message: `Warehouse ${warehouseId} is not owned by the active organization`,
        code: 'AUTH_FORBIDDEN',
        warehouseId,
      });
    }
    const rows = await this.slaService.findByWarehouse({
      warehouseId,
      days: query.days,
    });
    return {
      warehouseId,
      windowDays: query.days,
      rows: rows.map(mapRow),
    };
  }
}

function mapRow(
  row: import('../schemas/warehouse-sla-score.schema.js').WarehouseSlaScoreDocument,
): {
  id: string;
  warehouseId: string;
  vendorId: string;
  date: string;
  ordersPickedOnTime: number;
  ordersPickedLate: number;
  sla7DayAvgPct: number | null;
} {
  return {
    id: row.id as unknown as string,
    warehouseId: row.warehouseId,
    vendorId: row.vendorId,
    date: row.date,
    ordersPickedOnTime: row.ordersPickedOnTime,
    ordersPickedLate: row.ordersPickedLate,
    sla7DayAvgPct: row.sla7DayAvgPct,
  };
}
