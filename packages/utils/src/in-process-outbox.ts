import { EventEmitter } from 'node:events';

import type { Connection } from 'mongoose';
import { LRUCache } from 'lru-cache';

import {
  OUTBOX_PORT,
  type OutboxEventHandler,
  type OutboxPort,
  type PublishOptions,
  type Subscription,
} from './outbox-port.js';
import { MongoOutboxRepository } from './mongo-outbox-repository.js';
import { retry } from './retry.js';

// Polyfill for environments missing AggregateError (Node < 15). Our floor
// is Node 22 so this is informational; declared for the type system.
declare const AggregateError: typeof globalThis.AggregateError;

export interface InProcessOutboxOptions {
  /**
   * Poll interval in milliseconds. Default 250 ms — matches Stripe +
   * Shopify webhook-relayer norms. Override via env var
   * `OUTBOX_POLL_INTERVAL_MS`.
   */
  pollIntervalMs?: number;
  /** Rows claimed per poll tick. Default 25. */
  batchSize?: number;
  /** LRU dedup cache size (idempotency keys). Default 10_000. */
  dedupCacheSize?: number;
  /**
   * Threshold (ms) for considering a `publishing` row stale (crashed
   * mid-emit) at bootstrap. Default 30_000 (30s).
   */
  staleClaimMs?: number;
  /** Logger fn for relayer diagnostics. Defaults to noop. */
  log?: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * In-process outbox relayer: polls the Mongo `outbox.events` collection,
 * emits each pending row via a `node:events` EventEmitter, and marks
 * the row published. Idempotency-key LRU dedup prevents double-delivery
 * within the cache window (10k keys = ~6 min at 25 events/s peak).
 *
 * Per `.cursor/rules/deployment-mode.mdc` this is the MVP transport.
 * Production swap to Upstash Workflow + QStash post-revenue per
 * `docs/runbooks/scaling-up.md`.
 */
export class InProcessOutboxPort implements OutboxPort {
  private readonly repository: MongoOutboxRepository;
  private readonly emitter = new EventEmitter();
  private readonly dedup: LRUCache<string, true>;
  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly staleClaimMs: number;
  private readonly log: (message: string, meta?: Record<string, unknown>) => void;
  private pollHandle: NodeJS.Timeout | null = null;
  private currentTick: Promise<void> | null = null;

  constructor(connection: Connection, opts: InProcessOutboxOptions = {}) {
    this.repository = new MongoOutboxRepository(connection);
    this.pollIntervalMs = opts.pollIntervalMs ?? 250;
    this.batchSize = opts.batchSize ?? 25;
    this.staleClaimMs = opts.staleClaimMs ?? 30_000;
    this.dedup = new LRUCache<string, true>({ max: opts.dedupCacheSize ?? 10_000 });
    this.log = opts.log ?? (() => {});
  }

  async publish(
    event: { type: string; payload: unknown; idempotencyKey: string },
    opts: PublishOptions,
  ): Promise<void> {
    await this.repository.insert(event, opts.session);
  }

  subscribe(eventType: string, handler: OutboxEventHandler): Subscription {
    // Dedup happens at the per-event boundary in `tick()` (keyed on
    // idempotencyKey), NOT inside this wrapper. This wrapper just runs
    // the handler. Multiple subscribers per eventType therefore each
    // receive every event exactly once.
    const wrapped = async (event: Parameters<OutboxEventHandler>[0]) => {
      await handler(event);
    };
    this.emitter.on(eventType, wrapped);
    return {
      unsubscribe: () => {
        this.emitter.off(eventType, wrapped);
      },
    };
  }

  start(): void {
    if (this.pollHandle !== null) return;
    void this.repository
      .recoverStaleClaims(this.staleClaimMs)
      .then((recovered) => {
        if (recovered > 0) {
          this.log('outbox: recovered stale claims', { recovered });
        }
      })
      .catch((err) => {
        this.log('outbox: stale-claim recovery failed', { error: String(err) });
      });

    this.pollHandle = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
    // First drain any in-flight tick (don't short-circuit it), THEN
    // run one final drain pass so any rows committed between the last
    // interval and stop() get published.
    if (this.currentTick) {
      await this.currentTick;
    }
    await this.tick();
    this.emitter.removeAllListeners();
  }

  private async tick(): Promise<void> {
    if (this.currentTick) return;
    this.currentTick = this.runTick();
    try {
      await this.currentTick;
    } finally {
      this.currentTick = null;
    }
  }

  private async runTick(): Promise<void> {
    try {
      const claimed = await this.repository.claim(this.batchSize);
      for (const row of claimed) {
        // Cross-subscriber dedup: if we've already emitted an event with
        // this idempotencyKey in this process recently (LRU window),
        // skip emit + mark published. Keyed at the per-event boundary
        // so every subscriber for the same eventType still runs once on
        // first delivery.
        if (this.dedup.has(row.idempotencyKey)) {
          await this.repository.markPublished(row._id);
          continue;
        }
        const event = {
          type: row.eventType,
          payload: row.payload,
          idempotencyKey: row.idempotencyKey,
          eventId: row._id,
          occurredAt: row.createdAt.toISOString(),
        };
        try {
          await this.emitListenersWithRetry(row.eventType, event);
          this.dedup.set(row.idempotencyKey, true);
          await this.repository.markPublished(row._id);
        } catch (err) {
          await this.repository.markFailed(row._id, String(err));
          this.log('outbox: handler failed', { id: row._id, error: String(err) });
        }
      }
    } catch (err) {
      this.log('outbox: poll tick error', { error: String(err) });
    }
  }

  /**
   * Emit to each subscriber with PER-LISTENER retry. A failing listener
   * is retried in isolation; previously-successful listeners are NOT
   * re-invoked. This is critical because the alternative (retry around
   * the whole listener loop) would re-trigger side-effects on every
   * already-successful subscriber whenever a single one fails.
   *
   * Service-author contract: handlers MUST be idempotent within the LRU
   * dedup window even with per-listener retry, because we can't
   * distinguish "transient error" from "permanent error" at this layer.
   */
  private async emitListenersWithRetry(
    eventType: string,
    event: Parameters<OutboxEventHandler>[0],
  ): Promise<void> {
    const listeners = this.emitter.listeners(eventType) as Array<
      (e: typeof event) => Promise<void> | void
    >;
    const errors: unknown[] = [];
    for (const listener of listeners) {
      try {
        await retry(() => Promise.resolve(listener(event)), {
          attempts: 3,
          baseDelayMs: 100,
        });
      } catch (err) {
        errors.push(err);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, `${errors.length} listener(s) failed for ${eventType}`);
    }
  }
}

export { OUTBOX_PORT };
