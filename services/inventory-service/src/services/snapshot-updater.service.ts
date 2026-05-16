import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { OUTBOX_PORT, type OutboxPort, type Subscription } from '@repo/utils';
import {
  InventoryStockLedgerAppendedV1,
  type InventoryStockLedgerAppendedV1Payload,
} from '@repo/events';

import {
  STOCK_LEDGER_MODEL,
  STOCK_SNAPSHOT_MODEL,
  type StockLedgerDocument,
  type StockSnapshotDocument,
} from '../schemas/index.js';

const log = new Logger('SnapshotUpdaterService');

@Injectable()
export class SnapshotUpdaterService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private subscriptions: Subscription[] = [];

  constructor(
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
    @InjectModel(STOCK_LEDGER_MODEL) private readonly ledgerModel: Model<StockLedgerDocument>,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
  ) {}

  onApplicationBootstrap(): void {
    this.subscriptions.push(
      this.outbox.subscribe(InventoryStockLedgerAppendedV1.name, async (event) => {
        await this.handleAppended(event.payload as InventoryStockLedgerAppendedV1Payload);
      }),
    );
    log.log('Subscribed to inventory.stock-ledger-appended.v1');
  }

  onApplicationShutdown(): void {
    for (const sub of this.subscriptions) sub.unsubscribe();
    this.subscriptions = [];
  }

  async handleAppended(payload: InventoryStockLedgerAppendedV1Payload): Promise<void> {
    const entry = await this.ledgerModel
      .findOne({ id: payload.ledgerEntryId })
      .exec();
    if (!entry) return;

    const snap = await this.snapshotModel
      .findOne({ variantId: payload.variantId, warehouseId: payload.warehouseId })
      .exec();
    if (!snap) return;

    const seq = entry.ledgerSeq;
    if (seq <= snap.lastSnapshotLedgerSeq) {
      await this.snapshotModel
        .updateOne(
          { id: snap.id },
          { $inc: { pendingLedgerCount: -1 } },
        )
        .exec();
      return;
    }

    await this.snapshotModel
      .updateOne(
        { id: snap.id },
        {
          $set: {
            onHand: payload.newOnHand,
            lastMovementAt: new Date(),
            lastSnapshotLedgerSeq: seq,
            updatedBy: entry.actorId,
          },
          $inc: { pendingLedgerCount: -1 },
        },
      )
      .exec();
  }
}
