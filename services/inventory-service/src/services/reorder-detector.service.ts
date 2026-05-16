import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { InventoryReorderNeededV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { IST_TIMEZONE } from '@repo/types';

import { STOCK_SNAPSHOT_MODEL, type StockSnapshotDocument } from '../schemas/index.js';
import { ANALYTICS_TOKEN } from '../inventory-service.tokens.js';

@Injectable()
export class ReorderDetectorService {
  private readonly log = new Logger(ReorderDetectorService.name);

  constructor(
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  @Cron('0 0 9 * * *', { timeZone: IST_TIMEZONE })
  async detectDaily(): Promise<void> {
    const rows = await this.snapshotModel
      .find({ $expr: { $lt: ['$onHand', '$reorderPoint'] } })
      .limit(500)
      .exec();
    const detectedAt = new Date().toISOString();
    for (const row of rows) {
      await withTransaction(this.connection, async (session) => {
        await this.outbox.publish(
          {
            type: InventoryReorderNeededV1.name,
            idempotencyKey: `reorder-cron:${row.variantId}:${row.warehouseId}:${detectedAt.slice(0, 10)}`,
            payload: {
              orgId: row.orgId,
              vendorId: row.vendorId,
              warehouseId: row.warehouseId,
              variantId: row.variantId,
              onHand: row.onHand,
              reorderPoint: row.reorderPoint,
              suggestedOrderQty: row.reorderQty,
              detectedAt,
            },
          },
          { session },
        );
      });
      this.analytics.capture({
        distinctId: 'system',
        event: 'inventory reorder_needed',
        properties: {
          org_id: row.orgId,
          vendor_id: row.vendorId,
          warehouse_id: row.warehouseId,
          variant_id: row.variantId,
        },
      });
    }
    this.log.log(`Reorder scan complete — ${rows.length} rows emitted`);
  }
}
