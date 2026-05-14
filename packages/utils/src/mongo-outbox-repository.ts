import type { ClientSession, Connection } from 'mongoose';

import { getOutboxModel, type OutboxDoc } from '@repo/database';

import { ulid } from './ulid.js';

/**
 * Persistence layer for the `outbox.events` collection consumed by the
 * relayer. Wraps the raw Mongoose model with focused methods so the
 * relayer + tests can substitute a fake repository when needed.
 */
export class MongoOutboxRepository {
  constructor(private readonly connection: Connection) {}

  private get model() {
    return getOutboxModel(this.connection);
  }

  /**
   * Insert a new event row. Called from inside a Mongo transaction so
   * the row commits atomically with the domain write that produced it.
   */
  async insert(
    event: { type: string; payload: unknown; idempotencyKey: string },
    session: ClientSession,
  ): Promise<OutboxDoc> {
    const doc = await this.model.create(
      [
        {
          _id: ulid(),
          eventType: event.type,
          payload: event.payload,
          status: 'pending' as const,
          attemptCount: 0,
          idempotencyKey: event.idempotencyKey,
          createdAt: new Date(),
        },
      ],
      { session },
    );
    return doc[0]!;
  }

  /**
   * Atomically claim up to `batchSize` pending rows, moving them to
   * `status = 'publishing'`. `findOneAndUpdate` + `_id`-based loop
   * because Mongoose 8 doesn't ship a multi-document atomic claim API.
   */
  async claim(batchSize: number): Promise<OutboxDoc[]> {
    const claimed: OutboxDoc[] = [];
    for (let i = 0; i < batchSize; i++) {
      const doc = await this.model.findOneAndUpdate(
        { status: 'pending' },
        {
          $set: { status: 'publishing', lastAttemptAt: new Date() },
          $inc: { attemptCount: 1 },
        },
        { sort: { createdAt: 1 }, new: true },
      );
      if (!doc) break;
      claimed.push(doc.toObject() as OutboxDoc);
    }
    return claimed;
  }

  /**
   * Mark an event row published — the relayer calls this after the
   * EventEmitter emit completes without throwing.
   */
  async markPublished(id: string): Promise<void> {
    await this.model.updateOne(
      { _id: id },
      { $set: { status: 'published', publishedAt: new Date() } },
    );
  }

  /**
   * Move a claimed row back to `failed` with the error message. The
   * relayer's retry-with-backoff handles the eventual re-publish; ops
   * inspect `failed` rows in the admin dashboard.
   */
  async markFailed(id: string, error: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { status: 'failed', error } });
  }

  /**
   * Reset stale `publishing` rows (the relayer crashed mid-emit) back
   * to `pending` so the next poll cycle picks them up. Called at
   * bootstrap from `InProcessOutboxPort.start()`.
   */
  async recoverStaleClaims(olderThanMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMs);
    const result = await this.model.updateMany(
      { status: 'publishing', lastAttemptAt: { $lt: cutoff } },
      { $set: { status: 'pending' } },
    );
    return result.modifiedCount;
  }
}
