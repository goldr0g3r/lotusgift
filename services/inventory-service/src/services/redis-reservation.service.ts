import {
  ConflictException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';

import { Redis } from '@upstash/redis';

import { ulid } from '@repo/utils';
import {
  DEFAULT_RESERVATION_TTL_SEC,
  RESERVATION_TTL_MAX_EXTENSIONS,
} from '@repo/types';
import type { Env } from '@repo/config';
import type {
  ReservationExtendInput,
  ReservationPort,
  ReservationReleaseInput,
  ReservationReserveInput,
  ReservationResult,
  ReservationSnapshot,
} from '@repo/utils';

interface RedisReservationValue {
  reservationId: string;
  qty: number;
  extensionCount: number;
  cartId?: string;
  actorId: string;
  createdAt: string;
  expiresAt: string;
}

@Injectable()
export class RedisReservationService implements ReservationPort {
  private readonly log = new Logger(RedisReservationService.name);
  private readonly redis: Redis;

  constructor(env: Env) {
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required');
    }
    this.redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  private key(variantId: string, warehouseId: string, idempotencyKey: string): string {
    return `inv:reservation:${variantId}:${warehouseId}:${idempotencyKey}`;
  }

  async reserve(input: ReservationReserveInput): Promise<ReservationResult> {
    const k = this.key(input.variantId, input.warehouseId, input.idempotencyKey);
    const reservationId = ulid();
    const expiresAt = new Date(Date.now() + input.ttlSec * 1000).toISOString();
    const value: RedisReservationValue = {
      reservationId,
      qty: input.qty,
      extensionCount: 0,
      cartId: input.cartId,
      actorId: input.actorId,
      createdAt: new Date().toISOString(),
      expiresAt,
    };
    const set = await this.redis.set(k, JSON.stringify(value), {
      nx: true,
      ex: input.ttlSec,
    });
    if (set === null) {
      const existing = await this.redis.get<string>(k);
      if (!existing) {
        return { ok: false, reservationId: '', ttlSec: 0, extensionCount: 0, created: false };
      }
      const parsed = JSON.parse(existing) as RedisReservationValue;
      return {
        ok: true,
        reservationId: parsed.reservationId,
        ttlSec: input.ttlSec,
        extensionCount: parsed.extensionCount,
        created: false,
      };
    }
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
    const raw = await this.redis.get<string>(k);
    if (!raw) {
      throw new UnprocessableEntityException({
        message: 'Reservation not found',
        code: 'RESERVATION_NOT_FOUND',
      });
    }
    const parsed = JSON.parse(raw) as RedisReservationValue;
    if (parsed.extensionCount >= RESERVATION_TTL_MAX_EXTENSIONS) {
      throw new ConflictException({
        message: 'Reservation TTL already extended once',
        code: 'RESERVATION_ALREADY_EXTENDED',
      });
    }
    parsed.extensionCount += 1;
    parsed.expiresAt = new Date(Date.now() + input.ttlSec * 1000).toISOString();
    await this.redis.set(k, JSON.stringify(parsed), { ex: input.ttlSec, xx: true });
    return {
      ok: true,
      reservationId: parsed.reservationId,
      ttlSec: input.ttlSec,
      extensionCount: parsed.extensionCount,
      created: false,
    };
  }

  async release(input: ReservationReleaseInput): Promise<void> {
    await this.redis.del(this.key(input.variantId, input.warehouseId, input.idempotencyKey));
  }

  async peek(variantId: string, warehouseId: string): Promise<ReservationSnapshot[]> {
    const pattern = `inv:reservation:${variantId}:${warehouseId}:*`;
    const keys = await this.scanKeys(pattern);
    const results: ReservationSnapshot[] = [];
    for (const k of keys) {
      const raw = await this.redis.get<string>(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as RedisReservationValue;
      const idempotencyKey = k.split(':').pop() ?? '';
      results.push({
        reservationId: parsed.reservationId,
        variantId,
        warehouseId,
        qty: parsed.qty,
        idempotencyKey,
        extensionCount: parsed.extensionCount,
        expiresAt: parsed.expiresAt,
        cartId: parsed.cartId,
      });
    }
    return results;
  }

  private async scanKeys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async disconnect(): Promise<void> {
    this.log.log('Redis reservation client closed');
  }
}

export { DEFAULT_RESERVATION_TTL_SEC };
