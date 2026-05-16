import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { InventoryDeadStockDetectedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { IST_TIMEZONE } from '@repo/types';
import type { Env } from '@repo/config';

import { STOCK_SNAPSHOT_MODEL, type StockSnapshotDocument } from '../schemas/index.js';
import { ANALYTICS_TOKEN, ENV_TOKEN } from '../inventory-service.tokens.js';

@Injectable()
export class DeadStockDetectorService {
  private readonly log = new Logger(DeadStockDetectorService.name);

  constructor(
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
    @Inject(ENV_TOKEN) private readonly env: Env,
  ) {}

  @Cron('0 0 10 * * *', { timeZone: IST_TIMEZONE })
  async detectDaily(): Promise<void> {
    const e = this.env as Env & { INVENTORY_DEAD_STOCK_WINDOW_DAYS?: number };
    const windowDays = e.INVENTORY_DEAD_STOCK_WINDOW_DAYS ?? 60;
    const cutoff = new Date(Date.now() - windowDays * 86_400_000);
    const rows = await this.snapshotModel
      .find({ lastMovementAt: { $lt: cutoff }, onHand: { $gt: 0 } })
      .limit(500)
      .exec();
    const detectedAt = new Date().toISOString();
    for (const row of rows) {
      const daysSinceLastMovement = Math.floor(
        (Date.now() - row.lastMovementAt.getTime()) / 86_400_000,
      );
      await withTransaction(this.connection, async (session) => {
        await this.outbox.publish(
          {
            type: InventoryDeadStockDetectedV1.name,
            idempotencyKey: `dead-stock:${row.variantId}:${row.warehouseId}:${detectedAt.slice(0, 10)}`,
            payload: {
              orgId: row.orgId,
              vendorId: row.vendorId,
              warehouseId: row.warehouseId,
              variantId: row.variantId,
              onHand: row.onHand,
              daysSinceLastMovement,
              detectedAt,
            },
          },
          { session },
        );
      });
      this.analytics.capture({
        distinctId: 'system',
        event: 'inventory dead_stock_detected',
        properties: {
          org_id: row.orgId,
          vendor_id: row.vendorId,
          warehouse_id: row.warehouseId,
          variant_id: row.variantId,
        },
      });
    }
    this.log.log(`Dead-stock scan complete — ${rows.length} rows emitted`);
  }
}
