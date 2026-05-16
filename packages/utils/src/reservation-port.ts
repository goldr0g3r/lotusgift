/**
 * Cross-module reservation contract for P9 order-saga consumption.
 * Real impl: `RedisReservationService` / `InMemoryReservationService`
 * in inventory-service; stub for tests and pre-P8 gateway wiring.
 */

export interface ReservationSnapshot {
  readonly reservationId: string;
  readonly variantId: string;
  readonly warehouseId: string;
  readonly qty: number;
  readonly idempotencyKey: string;
  readonly extensionCount: number;
  readonly expiresAt: string;
  readonly cartId?: string;
}

export interface ReservationReserveInput {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly qty: number;
  readonly idempotencyKey: string;
  readonly ttlSec: number;
  readonly cartId?: string;
  readonly actorId: string;
}

export interface ReservationExtendInput {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly idempotencyKey: string;
  readonly ttlSec: number;
}

export interface ReservationReleaseInput {
  readonly variantId: string;
  readonly warehouseId: string;
  readonly idempotencyKey: string;
}

export interface ReservationResult {
  readonly ok: boolean;
  readonly reservationId: string;
  readonly ttlSec: number;
  readonly extensionCount: number;
  readonly created: boolean;
}

export interface ReservationPort {
  reserve(input: ReservationReserveInput): Promise<ReservationResult>;
  extend(input: ReservationExtendInput): Promise<ReservationResult>;
  release(input: ReservationReleaseInput): Promise<void>;
  peek(variantId: string, warehouseId: string): Promise<ReservationSnapshot[]>;
}

export const RESERVATION_PORT = Symbol.for('@repo/utils#ReservationPort');

export class StubReservationPort implements ReservationPort {
  async reserve(input: ReservationReserveInput): Promise<ReservationResult> {
    return {
      ok: true,
      reservationId: `stub-${input.idempotencyKey}`,
      ttlSec: input.ttlSec,
      extensionCount: 0,
      created: true,
    };
  }

  async extend(input: ReservationExtendInput): Promise<ReservationResult> {
    return {
      ok: true,
      reservationId: `stub-${input.idempotencyKey}`,
      ttlSec: input.ttlSec,
      extensionCount: 1,
      created: false,
    };
  }

  async release(): Promise<void> {
    /* no-op */
  }

  async peek(): Promise<ReservationSnapshot[]> {
    return [];
  }
}
