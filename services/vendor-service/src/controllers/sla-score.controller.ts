import { Controller, Get, Param, Query } from '@nestjs/common';

import { SlaScoringService } from '../services/sla-scoring.service.js';

/**
 * Per-warehouse SLA score READ-ONLY endpoint. Returns an empty array at
 * MVP until P21 observability cron lands.
 */
@Controller('warehouses/:warehouseId/sla-score')
export class SlaScoreController {
  constructor(private readonly slaService: SlaScoringService) {}

  @Get()
  async getByWarehouse(
    @Param('warehouseId') warehouseId: string,
    @Query('days') daysRaw?: string,
  ): Promise<{
    warehouseId: string;
    windowDays: number;
    rows: ReturnType<typeof mapRow>[];
  }> {
    const days = Math.min(90, Math.max(1, daysRaw ? Number(daysRaw) || 7 : 7));
    const rows = await this.slaService.findByWarehouse({ warehouseId, days });
    return {
      warehouseId,
      windowDays: days,
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
