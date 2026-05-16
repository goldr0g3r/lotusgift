import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import {
  RedisStockReadPort,
  RESERVATION_PORT,
  STOCK_READ_PORT,
  type ReservationPort,
  type StockReadPort,
} from '@repo/utils';
import type { StockSnapshot } from '@repo/validators';

import { STOCK_SNAPSHOT_MODEL, type StockSnapshotDocument } from '../schemas/index.js';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

@Injectable()
export class AvailabilityService {
  private readonly stockRead: StockReadPort;

  constructor(
    @InjectConnection() connection: Connection,
    @Inject(RESERVATION_PORT) reservations: ReservationPort,
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
  ) {
    this.stockRead = new RedisStockReadPort(connection, reservations);
  }

  async batchGetAggregated(
    variantIds: readonly string[],
  ): Promise<Map<string, { available: number; reserved: number; updatedAt: string }>> {
    return this.stockRead.batchGet(variantIds);
  }

  async batchGetByWarehouse(
    variantIds: readonly string[],
  ): Promise<Record<string, StockSnapshot[]>> {
    const rows = await this.snapshotModel
      .find({ variantId: { $in: [...variantIds] } })
      .exec();
    const result: Record<string, StockSnapshot[]> = {};
    for (const id of variantIds) {
      result[id] = [];
    }
    for (const row of rows) {
      const list = result[row.variantId] ?? [];
      const updated =
        (row as StockSnapshotDocument & { updatedAt?: Date }).updatedAt ??
        row.lastMovementAt;
      list.push({
        variantId: row.variantId as StockSnapshot['variantId'],
        warehouseId: row.warehouseId as StockSnapshot['warehouseId'],
        orgId: row.orgId as StockSnapshot['orgId'],
        vendorId: row.vendorId as StockSnapshot['vendorId'],
        onHand: row.onHand,
        reservedCount: row.reservedCount,
        available: Math.max(0, row.onHand - row.reservedCount),
        lowStockThreshold: row.lowStockThreshold,
        reorderPoint: row.reorderPoint,
        reorderQty: row.reorderQty,
        pendingLedgerCount: row.pendingLedgerCount,
        lastMovementAt: row.lastMovementAt.toISOString() as StockSnapshot['lastMovementAt'],
        updatedAt: updated.toISOString() as StockSnapshot['updatedAt'],
      });
      result[row.variantId] = list;
    }
    return result;
  }
}

export { STOCK_READ_PORT };
