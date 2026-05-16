import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, type Model } from 'mongoose';

import {
  RESERVATION_PORT,
  ulid,
  OUTBOX_PORT,
  type OutboxPort,
  type ReservationPort,
} from '@repo/utils';
import { withTransaction } from '@repo/database';
import {
  InventoryReservationCreatedV1,
  InventoryReservationExpiredV1,
} from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { DEFAULT_RESERVATION_TTL_SEC } from '@repo/types';
import type { Env } from '@repo/config';
import { WarehouseService } from '@lotusgift/vendor-service';

import {
  RESERVATION_AUDIT_MODEL,
  type ReservationAuditDocument,
} from '../schemas/index.js';
import { ANALYTICS_TOKEN, ENV_TOKEN } from '../inventory-service.tokens.js';

export interface CreateReservationArgs {
  variantId: string;
  warehouseId: string;
  qty: number;
  idempotencyKey: string;
  cartId?: string;
  actorId: string;
}

@Injectable()
export class ReservationService {
  constructor(
    @Inject(RESERVATION_PORT) private readonly reservations: ReservationPort,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @InjectModel(RESERVATION_AUDIT_MODEL)
    private readonly auditModel: Model<ReservationAuditDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly warehouses: WarehouseService,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
    @Inject(ENV_TOKEN) private readonly env: Env,
  ) {}

  private ttlSec(): number {
    const e = this.env as Env & { INVENTORY_RESERVATION_TTL_SECONDS?: number };
    return e.INVENTORY_RESERVATION_TTL_SECONDS ?? DEFAULT_RESERVATION_TTL_SEC;
  }

  async create(args: CreateReservationArgs): Promise<ReservationAuditDocument> {
    const warehouse = await this.warehouses.findById(args.warehouseId);
    if (!warehouse) {
      throw new NotFoundException({
        message: `Warehouse ${args.warehouseId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }

    const ttlSec = this.ttlSec();
    const result = await this.reservations.reserve({
      variantId: args.variantId,
      warehouseId: args.warehouseId,
      qty: args.qty,
      idempotencyKey: args.idempotencyKey,
      ttlSec,
      cartId: args.cartId,
      actorId: args.actorId,
    });
    if (!result.ok) {
      throw new ConflictException({
        message: 'Could not create reservation',
        code: 'RESERVATION_FAILED',
      });
    }

    const expiresAt = new Date(Date.now() + ttlSec * 1000);
    const audit = await this.auditModel.create({
      id: ulid(),
      orgId: warehouse.orgId,
      vendorId: warehouse.vendorId,
      warehouseId: args.warehouseId,
      variantId: args.variantId,
      reservationId: result.reservationId,
      qty: args.qty,
      status: 'PENDING',
      ttlExpiresAt: expiresAt,
      cartId: args.cartId ?? null,
      idempotencyKey: args.idempotencyKey,
      createdBy: args.actorId,
      updatedBy: args.actorId,
    });

    await withTransaction(this.connection, async (session) => {
      await this.outbox.publish(
        {
          type: InventoryReservationCreatedV1.name,
          idempotencyKey: `reservation:${result.reservationId}:created:1`,
          payload: {
            orgId: warehouse.orgId,
            vendorId: warehouse.vendorId,
            warehouseId: args.warehouseId,
            variantId: args.variantId,
            reservationId: result.reservationId,
            qty: args.qty,
            ttlSec,
            idempotencyKey: args.idempotencyKey,
            cartId: args.cartId,
          },
        },
        { session },
      );
    });

    this.analytics.capture({
      distinctId: args.actorId,
      event: 'inventory reservation_created',
      properties: {
        org_id: warehouse.orgId,
        vendor_id: warehouse.vendorId,
        warehouse_id: args.warehouseId,
        variant_id: args.variantId,
      },
    });

    return audit;
  }

  async extend(
    reservationId: string,
    idempotencyKey: string,
    variantId: string,
    warehouseId: string,
    actorId: string,
  ): Promise<void> {
    const warehouse = await this.warehouses.findById(warehouseId);
    if (!warehouse) {
      throw new NotFoundException({
        message: `Warehouse ${warehouseId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    const ttlSec = this.ttlSec();
    const result = await this.reservations.extend({
      variantId,
      warehouseId,
      idempotencyKey,
      ttlSec,
    });
    if (!result.ok) {
      throw new ConflictException({
        message: 'Reservation TTL already extended once',
        code: 'RESERVATION_ALREADY_EXTENDED',
      });
    }
    await this.auditModel
      .updateOne({ reservationId }, { $set: { status: 'EXTENDED', updatedBy: actorId } })
      .exec();
    this.analytics.capture({
      distinctId: actorId,
      event: 'inventory reservation_extended',
      properties: {
        org_id: warehouse.orgId,
        vendor_id: warehouse.vendorId,
        warehouse_id: warehouseId,
        variant_id: variantId,
      },
    });
  }

  async getByReservationId(reservationId: string): Promise<ReservationAuditDocument | null> {
    return this.auditModel.findOne({ reservationId }).exec();
  }

  async release(
    variantId: string,
    warehouseId: string,
    idempotencyKey: string,
    actorId: string,
  ): Promise<void> {
    await this.reservations.release({ variantId, warehouseId, idempotencyKey });
    await this.auditModel
      .updateMany(
        { idempotencyKey, variantId, warehouseId },
        { $set: { status: 'RELEASED', updatedBy: actorId } },
      )
      .exec();
    this.analytics.capture({
      distinctId: actorId,
      event: 'inventory reservation_consumed',
      properties: { variant_id: variantId, warehouse_id: warehouseId },
    });
  }

  async emitExpired(args: {
    orgId: string;
    vendorId: string;
    warehouseId: string;
    variantId: string;
    reservationId: string;
    qty: number;
    idempotencyKey: string;
    actorId: string;
  }): Promise<void> {
    await withTransaction(this.connection, async (session) => {
      await this.outbox.publish(
        {
          type: InventoryReservationExpiredV1.name,
          idempotencyKey: `reservation:${args.reservationId}:expired:1`,
          payload: {
            orgId: args.orgId,
            vendorId: args.vendorId,
            warehouseId: args.warehouseId,
            variantId: args.variantId,
            reservationId: args.reservationId,
            qty: args.qty,
            idempotencyKey: args.idempotencyKey,
          },
        },
        { session },
      );
    });
    await this.auditModel
      .updateOne(
        { reservationId: args.reservationId },
        { $set: { status: 'EXPIRED', updatedBy: args.actorId } },
      )
      .exec();
    this.analytics.capture({
      distinctId: args.actorId,
      event: 'inventory reservation_expired',
      properties: {
        org_id: args.orgId,
        vendor_id: args.vendorId,
        warehouse_id: args.warehouseId,
        variant_id: args.variantId,
      },
    });
  }
}
