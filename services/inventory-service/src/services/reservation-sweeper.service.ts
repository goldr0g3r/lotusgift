import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RESERVATION_PORT, type ReservationPort } from '@repo/utils';
import { IST_TIMEZONE } from '@repo/types';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { RESERVATION_AUDIT_MODEL, type ReservationAuditDocument } from '../schemas/index.js';
import { InMemoryReservationService } from './in-memory-reservation.service.js';
import { ReservationService } from './reservation.service.js';
import { RESERVATION_BACKEND_TOKEN } from '../inventory-service.tokens.js';

@Injectable()
export class ReservationSweeperService {
  private readonly log = new Logger(ReservationSweeperService.name);

  constructor(
    private readonly reservations: ReservationService,
    @Inject(RESERVATION_PORT) private readonly port: ReservationPort,
    @InjectModel(RESERVATION_AUDIT_MODEL)
    private readonly auditModel: Model<ReservationAuditDocument>,
    @Inject(RESERVATION_BACKEND_TOKEN)
    private readonly backend: ReservationPort,
  ) {}

  @Cron('*/60 * * * * *', { timeZone: IST_TIMEZONE })
  async sweep(): Promise<void> {
    if (this.backend instanceof InMemoryReservationService) {
      const expired = this.backend.listExpired();
      for (const { value, idempotencyKey } of expired) {
        const audit = await this.auditModel
          .findOne({ reservationId: value.reservationId })
          .exec();
        if (!audit || audit.status === 'EXPIRED') continue;
        await this.reservations.emitExpired({
          orgId: audit.orgId,
          vendorId: audit.vendorId,
          warehouseId: audit.warehouseId,
          variantId: audit.variantId,
          reservationId: value.reservationId,
          qty: value.qty,
          idempotencyKey,
          actorId: 'system',
        });
        this.backend.deleteKey(
          `inv:reservation:${audit.variantId}:${audit.warehouseId}:${idempotencyKey}`,
        );
      }
      return;
    }

    const stale = await this.auditModel
      .find({
        status: { $in: ['PENDING', 'EXTENDED'] },
        ttlExpiresAt: { $lt: new Date() },
      })
      .limit(100)
      .exec();
    for (const audit of stale) {
      await this.reservations.emitExpired({
        orgId: audit.orgId,
        vendorId: audit.vendorId,
        warehouseId: audit.warehouseId,
        variantId: audit.variantId,
        reservationId: audit.reservationId,
        qty: audit.qty,
        idempotencyKey: audit.idempotencyKey,
        actorId: 'system',
      });
      await this.port.release({
        variantId: audit.variantId,
        warehouseId: audit.warehouseId,
        idempotencyKey: audit.idempotencyKey,
      });
    }
    this.log.debug(`Swept ${stale.length} expired reservations`);
  }
}
