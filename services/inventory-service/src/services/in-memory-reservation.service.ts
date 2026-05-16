import { Injectable, Logger } from '@nestjs/common';

import { ulid } from '@repo/utils';
import {
  RESERVATION_TTL_MAX_EXTENSIONS,
  type ReservationStatusKey,
} from '@repo/types';
import type {
  ReservationExtendInput,
  ReservationPort,
  ReservationReleaseInput,
  ReservationReserveInput,
  ReservationResult,
  ReservationSnapshot,
} from '@repo/utils';

interface StoredValue {
  reservationId: string;
  qty: number;
  extensionCount: number;
  cartId?: string;
  actorId: string;
  expiresAt: number;
}

@Injectable()
export class InMemoryReservationService implements ReservationPort {
  private readonly log = new Logger(InMemoryReservationService.name);
  private readonly store = new Map<string, StoredValue>();

  constructor() {
    this.log.warn(
      'Using in-memory reservation backend — single-instance only; not suitable for multi-replica production.',
    );
  }

  private key(variantId: string, warehouseId: string, idempotencyKey: string): string {
    return `inv:reservation:${variantId}:${warehouseId}:${idempotencyKey}`;
  }

  async reserve(input: ReservationReserveInput): Promise<ReservationResult> {
    const k = this.key(input.variantId, input.warehouseId, input.idempotencyKey);
    const existing = this.store.get(k);
    if (existing && existing.expiresAt > Date.now()) {
      return {
        ok: true,
        reservationId: existing.reservationId,
        ttlSec: input.ttlSec,
        extensionCount: existing.extensionCount,
        created: false,
      };
    }
    const reservationId = ulid();
    this.store.set(k, {
      reservationId,
      qty: input.qty,
      extensionCount: 0,
      cartId: input.cartId,
      actorId: input.actorId,
      expiresAt: Date.now() + input.ttlSec * 1000,
    });
    return {
      ok: true,
      reservationId,
      ttlSec: input.ttlSec,
      extensionCount: 0,
      created: true,
    };
  }

  async extend(input: ReservationExtendInput): Promise<ReservationResult> {
    const k = this.key(input.variantId, input.warehouseId, input.idempotencyKey);
    const existing = this.store.get(k);
    if (!existing) {
      return { ok: false, reservationId: '', ttlSec: 0, extensionCount: 0, created: false };
    }
    if (existing.extensionCount >= RESERVATION_TTL_MAX_EXTENSIONS) {
      return {
        ok: false,
        reservationId: existing.reservationId,
        ttlSec: input.ttlSec,
        extensionCount: existing.extensionCount,
        created: false,
      };
    }
    existing.extensionCount += 1;
    existing.expiresAt = Date.now() + input.ttlSec * 1000;
    return {
      ok: true,
      reservationId: existing.reservationId,
      ttlSec: input.ttlSec,
      extensionCount: existing.extensionCount,
      created: false,
    };
  }

  async release(input: ReservationReleaseInput): Promise<void> {
    this.store.delete(this.key(input.variantId, input.warehouseId, input.idempotencyKey));
  }

  async peek(variantId: string, warehouseId: string): Promise<ReservationSnapshot[]> {
    const prefix = `inv:reservation:${variantId}:${warehouseId}:`;
    const now = Date.now();
    const results: ReservationSnapshot[] = [];
    for (const [k, v] of this.store) {
      if (!k.startsWith(prefix) || v.expiresAt <= now) continue;
      const idempotencyKey = k.slice(prefix.length);
      results.push({
        reservationId: v.reservationId,
        variantId,
        warehouseId,
        qty: v.qty,
        idempotencyKey,
        extensionCount: v.extensionCount,
        expiresAt: new Date(v.expiresAt).toISOString(),
        cartId: v.cartId,
      });
    }
    return results;
  }

  /** Sweeper helper — list expired keys still in the map. */
  listExpired(): Array<{ key: string; value: StoredValue; idempotencyKey: string }> {
    const now = Date.now();
    const expired: Array<{ key: string; value: StoredValue; idempotencyKey: string }> = [];
    for (const [key, value] of this.store) {
      if (value.expiresAt <= now) {
        const parts = key.split(':');
        expired.push({
          key,
          value,
          idempotencyKey: parts[parts.length - 1] ?? '',
        });
      }
    }
    return expired;
  }

  deleteKey(key: string): void {
    this.store.delete(key);
  }
}

export type { ReservationStatusKey };
