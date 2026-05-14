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
  private polling = false;

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
    const wrapped = async (event: Parameters<OutboxEventHandler>[0]) => {
      if (this.dedup.has(event.idempotencyKey)) return;
      this.dedup.set(event.idempotencyKey, true);
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
    // Drain a final tick so in-flight publishes get committed.
    await this.tick();
    this.emitter.removeAllListeners();
  }

  private async tick(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      const claimed = await this.repository.claim(this.batchSize);
      for (const row of claimed) {
        const event = {
          type: row.eventType,
          payload: row.payload,
          idempotencyKey: row.idempotencyKey,
          eventId: row._id,
          occurredAt: row.createdAt.toISOString(),
        };
        try {
          await retry(
            async () => {
              await this.emitListeners(row.eventType, event);
            },
            { attempts: 3, baseDelayMs: 100 },
          );
          await this.repository.markPublished(row._id);
        } catch (err) {
          await this.repository.markFailed(row._id, String(err));
          this.log('outbox: handler failed', { id: row._id, error: String(err) });
        }
      }
    } catch (err) {
      this.log('outbox: poll tick error', { error: String(err) });
    } finally {
      this.polling = false;
    }
  }

  private async emitListeners(
    eventType: string,
    event: Parameters<OutboxEventHandler>[0],
  ): Promise<void> {
    const listeners = this.emitter.listeners(eventType) as Array<
      (e: typeof event) => Promise<void> | void
    >;
    for (const listener of listeners) {
      await listener(event);
    }
  }
}

export { OUTBOX_PORT };
