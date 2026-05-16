import type { Connection } from 'mongoose';

import { namespace } from '@repo/database';

import {
  RESERVATION_PORT,
  type ReservationPort,
} from './reservation-port.js';
import type { StockReadPort, StockSnapshot } from './stock-read-port.js';

const SNAPSHOT_COLLECTION = namespace('inventory', 'stock_snapshots');
const LEDGER_COLLECTION = namespace('inventory', 'stock_ledger');
const PENDING_LAG_THRESHOLD = 5;

interface SnapshotRow {
  variantId: string;
  warehouseId: string;
  onHand: number;
  reservedCount: number;
  pendingLedgerCount: number;
  updatedAt?: Date;
}

/**
 * Real `StockReadPort` impl (P8). Aggregates materialized snapshots per
 * variant; falls back to ledger sum when `pendingLedgerCount` exceeds
 * the lag threshold (D5).
 */
export class RedisStockReadPort implements StockReadPort {
  constructor(
    private readonly connection: Connection,
    private readonly reservations: ReservationPort,
  ) {}

  async batchGet(variantIds: readonly string[]): Promise<Map<string, StockSnapshot>> {
    const result = new Map<string, StockSnapshot>();
    if (variantIds.length === 0) return result;

    const uniqueIds = [...new Set(variantIds)];
    const db = this.connection.db;
    if (!db) {
      for (const id of uniqueIds) {
        result.set(id, { available: 0, reserved: 0, updatedAt: new Date().toISOString() });
      }
      return result;
    }

    const rows = (await db
      .collection(SNAPSHOT_COLLECTION)
      .find({ variantId: { $in: uniqueIds } })
      .toArray()) as unknown as SnapshotRow[];

    const byVariant = new Map<string, SnapshotRow[]>();
    for (const row of rows) {
      const list = byVariant.get(row.variantId) ?? [];
      list.push(row);
      byVariant.set(row.variantId, list);
    }

    for (const variantId of uniqueIds) {
      const snapshots = byVariant.get(variantId) ?? [];
      if (snapshots.length === 0) {
        result.set(variantId, {
          available: 0,
          reserved: 0,
          updatedAt: new Date().toISOString(),
        });
        continue;
      }

      let onHandTotal = 0;
      let reservedTotal = 0;
      let latestUpdated = new Date(0);

      for (const snap of snapshots) {
        const needsLedgerFallback = snap.pendingLedgerCount > PENDING_LAG_THRESHOLD;
        let onHand = snap.onHand ?? 0;
        if (needsLedgerFallback) {
          onHand = await this.ledgerOnHand(db, variantId, snap.warehouseId);
        }
        const liveReserved = (await this.reservations.peek(variantId, snap.warehouseId)).reduce(
          (sum, r) => sum + r.qty,
          0,
        );
        const reserved = Math.max(snap.reservedCount ?? 0, liveReserved);
        onHandTotal += onHand;
        reservedTotal += reserved;
        const updated = snap.updatedAt ? new Date(snap.updatedAt) : new Date();
        if (updated > latestUpdated) latestUpdated = updated;
      }

      result.set(variantId, {
        available: Math.max(0, onHandTotal - reservedTotal),
        reserved: reservedTotal,
        updatedAt: latestUpdated.toISOString(),
      });
    }

    return result;
  }

  private async ledgerOnHand(
    db: NonNullable<Connection['db']>,
    variantId: string,
    warehouseId: string,
  ): Promise<number> {
    const agg = await db
      .collection(LEDGER_COLLECTION)
      .aggregate<{ total: number }>([
        { $match: { variantId, warehouseId } },
        { $group: { _id: null, total: { $sum: '$delta' } } },
      ])
      .toArray();
    return agg[0]?.total ?? 0;
  }
}

/** Nest DI factory helper — binds Connection + ReservationPort. */
export function createRedisStockReadPort(
  connection: Connection,
  reservations: ReservationPort,
): RedisStockReadPort {
  return new RedisStockReadPort(connection, reservations);
}

export { RESERVATION_PORT };
