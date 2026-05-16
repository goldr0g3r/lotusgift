import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import { ulid, OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import { withTransaction } from '@repo/database';
import { InventoryTransferredV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { WarehouseService } from '@lotusgift/vendor-service';

import { TRANSFER_MODEL, type TransferDocument } from '../schemas/index.js';
import { LedgerService } from './ledger.service.js';
import { ANALYTICS_TOKEN } from '../inventory-service.tokens.js';

export interface TransferInput {
  fromWarehouseId: string;
  toWarehouseId: string;
  variantId: string;
  qty: number;
  reasonNote: string;
  actorId: string;
}

@Injectable()
export class TransferService {
  constructor(
    @InjectModel(TRANSFER_MODEL) private readonly transferModel: Model<TransferDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    private readonly ledger: LedgerService,
    private readonly warehouses: WarehouseService,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  async transfer(input: TransferInput): Promise<TransferDocument> {
    const fromWh = await this.warehouses.findById(input.fromWarehouseId);
    const toWh = await this.warehouses.findById(input.toWarehouseId);
    if (!fromWh || !toWh) {
      throw new NotFoundException({
        message: 'Source or destination warehouse not found',
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    if (fromWh.vendorId !== toWh.vendorId) {
      throw new NotFoundException({
        message: 'Transfers must stay within the same vendor',
        code: 'VALIDATION_FAILED',
      });
    }

    const transferId = ulid();
    let created!: TransferDocument;

    await withTransaction(this.connection, async (session) => {
      const [row] = await this.transferModel.create(
        [
          {
            id: transferId,
            fromWarehouseId: input.fromWarehouseId,
            toWarehouseId: input.toWarehouseId,
            variantId: input.variantId,
            orgId: fromWh.orgId,
            vendorId: fromWh.vendorId,
            qty: input.qty,
            reasonNote: input.reasonNote,
            status: 'COMPLETED',
            initiatedBy: input.actorId,
            initiatedAt: new Date(),
            completedAt: new Date(),
            createdBy: input.actorId,
            updatedBy: input.actorId,
          },
        ],
        { session },
      );
      created = row as TransferDocument;

      await this.outbox.publish(
        {
          type: InventoryTransferredV1.name,
          idempotencyKey: `transfer:${transferId}:completed:1`,
          payload: {
            orgId: fromWh.orgId,
            vendorId: fromWh.vendorId,
            fromWarehouseId: input.fromWarehouseId,
            toWarehouseId: input.toWarehouseId,
            variantId: input.variantId,
            qty: input.qty,
            transferId,
            reasonNote: input.reasonNote,
          },
        },
        { session },
      );
    });

    await this.ledger.append({
      variantId: input.variantId,
      warehouseId: input.fromWarehouseId,
      orgId: fromWh.orgId,
      vendorId: fromWh.vendorId,
      delta: -input.qty,
      reason: 'TRANSFER_OUT',
      reasonNote: input.reasonNote,
      actorId: input.actorId,
      relatedTransferId: transferId,
    });
    await this.ledger.append({
      variantId: input.variantId,
      warehouseId: input.toWarehouseId,
      orgId: toWh.orgId,
      vendorId: toWh.vendorId,
      delta: input.qty,
      reason: 'TRANSFER_IN',
      reasonNote: input.reasonNote,
      actorId: input.actorId,
      relatedTransferId: transferId,
    });

    this.analytics.capture({
      distinctId: input.actorId,
      event: 'inventory transferred',
      properties: {
        org_id: fromWh.orgId,
        vendor_id: fromWh.vendorId,
        variant_id: input.variantId,
      },
    });

    return created;
  }
}
