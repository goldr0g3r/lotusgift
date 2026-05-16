import {
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { ulid, OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import {
  InventoryLowStockDetectedV1,
  InventoryReorderNeededV1,
  InventoryStockLedgerAppendedV1,
} from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import type { StockLedgerReason } from '@repo/types';
import type { Env } from '@repo/config';

import {
  STOCK_LEDGER_MODEL,
  STOCK_SNAPSHOT_MODEL,
  type StockLedgerDocument,
  type StockSnapshotDocument,
} from '../schemas/index.js';
import { ANALYTICS_TOKEN, ENV_TOKEN } from '../inventory-service.tokens.js';

export interface AppendLedgerInput {
  variantId: string;
  warehouseId: string;
  orgId: string;
  vendorId: string;
  delta: number;
  reason: StockLedgerReason;
  reasonNote?: string | null;
  actorId: string;
  relatedReservationId?: string;
  relatedTransferId?: string;
  relatedOrderId?: string;
}

@Injectable()
export class LedgerService {
  constructor(
    @InjectModel(STOCK_LEDGER_MODEL) private readonly ledgerModel: Model<StockLedgerDocument>,
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
    @Inject(ENV_TOKEN) private readonly env: Env,
  ) {}

  async append(input: AppendLedgerInput): Promise<StockLedgerDocument> {
    const entryId = ulid();
    let created!: StockLedgerDocument;
    let newOnHand = 0;

    await withTransaction(this.connection, async (session) => {
      const snapshot = await this.ensureSnapshot(input, session);
      const projected = snapshot.onHand + input.delta;
      if (projected < 0) {
        throw new UnprocessableEntityException({
          message: 'Insufficient stock for this ledger append',
          code: 'INSUFFICIENT_STOCK',
          variantId: input.variantId,
          warehouseId: input.warehouseId,
        });
      }

      const lastSeq =
        (
          await this.ledgerModel
            .findOne({ variantId: input.variantId, warehouseId: input.warehouseId })
            .sort({ ledgerSeq: -1 })
            .session(session)
            .exec()
        )?.ledgerSeq ?? 0;
      const ledgerSeq = lastSeq + 1;

      const [row] = await this.ledgerModel.create(
        [
          {
            id: entryId,
            variantId: input.variantId,
            warehouseId: input.warehouseId,
            orgId: input.orgId,
            vendorId: input.vendorId,
            delta: input.delta,
            reason: input.reason,
            reasonNote: input.reasonNote ?? null,
            actorId: input.actorId,
            relatedReservationId: input.relatedReservationId ?? null,
            relatedTransferId: input.relatedTransferId ?? null,
            relatedOrderId: input.relatedOrderId ?? null,
            ledgerSeq,
            createdBy: input.actorId,
            updatedBy: input.actorId,
          },
        ],
        { session },
      );
      created = row as StockLedgerDocument;

      await this.snapshotModel
        .updateOne(
          { variantId: input.variantId, warehouseId: input.warehouseId },
          {
            $inc: { pendingLedgerCount: 1 },
            $set: { updatedBy: input.actorId },
          },
          { session },
        )
        .exec();

      newOnHand = projected;

      await this.outbox.publish(
        {
          type: InventoryStockLedgerAppendedV1.name,
          idempotencyKey: `ledger:${entryId}:appended:1`,
          payload: {
            orgId: input.orgId,
            vendorId: input.vendorId,
            warehouseId: input.warehouseId,
            variantId: input.variantId,
            ledgerEntryId: entryId,
            delta: input.delta,
            reason: input.reason,
            newOnHand,
          },
        },
        { session },
      );
    });

    const sign = input.delta >= 0 ? 'positive' : 'negative';
    this.analytics.capture({
      distinctId: input.actorId,
      event: input.delta >= 0 ? 'inventory stock_incremented' : 'inventory stock_decremented',
      properties: {
        org_id: input.orgId,
        vendor_id: input.vendorId,
        warehouse_id: input.warehouseId,
        variant_id: input.variantId,
        delta_sign: sign,
        reason: input.reason,
      },
    });

    void this.maybeEmitThresholdEvents(input, newOnHand);
    return created;
  }

  async list(filter: {
    variantId?: string;
    warehouseId?: string;
    vendorId?: string;
    reason?: StockLedgerReason;
    since?: string;
    until?: string;
    page: number;
    limit: number;
  }): Promise<{ items: StockLedgerDocument[]; total: number }> {
    const query: Record<string, unknown> = {};
    if (filter.variantId) query.variantId = filter.variantId;
    if (filter.warehouseId) query.warehouseId = filter.warehouseId;
    if (filter.vendorId) query.vendorId = filter.vendorId;
    if (filter.reason) query.reason = filter.reason;
    if (filter.since || filter.until) {
      query.createdAt = {};
      if (filter.since) (query.createdAt as Record<string, Date>).$gte = new Date(filter.since);
      if (filter.until) (query.createdAt as Record<string, Date>).$lte = new Date(filter.until);
    }
    const skip = (filter.page - 1) * filter.limit;
    const [items, total] = await Promise.all([
      this.ledgerModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(filter.limit).exec(),
      this.ledgerModel.countDocuments(query).exec(),
    ]);
    return { items, total };
  }

  private async ensureSnapshot(
    input: AppendLedgerInput,
    session: import('mongoose').ClientSession,
  ): Promise<StockSnapshotDocument> {
    const existing = await this.snapshotModel
      .findOne({ variantId: input.variantId, warehouseId: input.warehouseId })
      .session(session)
      .exec();
    if (existing) return existing;

    const defaults = this.snapshotDefaults();
    const [created] = await this.snapshotModel.create(
      [
        {
          id: ulid(),
          variantId: input.variantId,
          warehouseId: input.warehouseId,
          orgId: input.orgId,
          vendorId: input.vendorId,
          onHand: 0,
          reservedCount: 0,
          ...defaults,
          lastMovementAt: new Date(),
          pendingLedgerCount: 0,
          lastSnapshotLedgerSeq: 0,
          createdBy: input.actorId,
          updatedBy: input.actorId,
        },
      ],
      { session },
    );
    return created as StockSnapshotDocument;
  }

  private snapshotDefaults(): {
    lowStockThreshold: number;
    reorderPoint: number;
    reorderQty: number;
  } {
    const env = this.env as Env & {
      INVENTORY_DEFAULT_LOW_STOCK_THRESHOLD?: number;
      INVENTORY_DEFAULT_REORDER_POINT?: number;
      INVENTORY_DEFAULT_REORDER_QTY?: number;
    };
    return {
      lowStockThreshold: env.INVENTORY_DEFAULT_LOW_STOCK_THRESHOLD ?? 10,
      reorderPoint: env.INVENTORY_DEFAULT_REORDER_POINT ?? 5,
      reorderQty: env.INVENTORY_DEFAULT_REORDER_QTY ?? 50,
    };
  }

  private async maybeEmitThresholdEvents(
    input: AppendLedgerInput,
    onHand: number,
  ): Promise<void> {
    const snap = await this.snapshotModel
      .findOne({ variantId: input.variantId, warehouseId: input.warehouseId })
      .exec();
    if (!snap) return;
    const detectedAt = new Date().toISOString();

    if (onHand < snap.lowStockThreshold) {
      await withTransaction(this.connection, async (session) => {
        await this.outbox.publish(
          {
            type: InventoryLowStockDetectedV1.name,
            idempotencyKey: `low-stock:${input.variantId}:${input.warehouseId}:${onHand}`,
            payload: {
              orgId: input.orgId,
              vendorId: input.vendorId,
              warehouseId: input.warehouseId,
              variantId: input.variantId,
              onHand,
              threshold: snap.lowStockThreshold,
              detectedAt,
            },
          },
          { session },
        );
      });
      this.analytics.capture({
        distinctId: input.actorId,
        event: 'inventory low_stock_detected',
        properties: {
          org_id: input.orgId,
          vendor_id: input.vendorId,
          warehouse_id: input.warehouseId,
          variant_id: input.variantId,
        },
      });
    }

    if (onHand < snap.reorderPoint) {
      await withTransaction(this.connection, async (session) => {
        await this.outbox.publish(
          {
            type: InventoryReorderNeededV1.name,
            idempotencyKey: `reorder:${input.variantId}:${input.warehouseId}:${onHand}`,
            payload: {
              orgId: input.orgId,
              vendorId: input.vendorId,
              warehouseId: input.warehouseId,
              variantId: input.variantId,
              onHand,
              reorderPoint: snap.reorderPoint,
              suggestedOrderQty: snap.reorderQty,
              detectedAt,
            },
          },
          { session },
        );
      });
      this.analytics.capture({
        distinctId: input.actorId,
        event: 'inventory reorder_needed',
        properties: {
          org_id: input.orgId,
          vendor_id: input.vendorId,
          warehouse_id: input.warehouseId,
          variant_id: input.variantId,
        },
      });
    }
  }
}
