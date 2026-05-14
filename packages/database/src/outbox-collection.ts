import { Schema, type Connection, type Model } from 'mongoose';

import { namespace } from './namespace.js';

/**
 * Mongo schema for the `outbox` collection consumed by
 * `@repo/utils/InProcessOutboxPort`. Wire shape matches
 * `@repo/events.OutboxRowSchema` exactly — the relayer round-trips Zod
 * parse on read.
 *
 * Indexes:
 * - `{ status: 1, createdAt: 1 }` — relayer poll for `pending` rows in
 *   FIFO order.
 * - `{ idempotencyKey: 1 }` — dedup check before re-publish on relayer
 *   crash-recovery.
 * - `{ publishedAt: 1 }` TTL 7d — automatic cleanup of published rows.
 *
 * Collection name: `outbox.events` (namespaced under the synthetic
 * `outbox` service slot — NOT in the 16-service domain allow-list, so we
 * compose the name manually here).
 */
export const OUTBOX_COLLECTION_NAME = 'outbox.events' as const;

interface OutboxDoc {
  _id: string;
  eventType: string;
  payload: unknown;
  status: 'pending' | 'publishing' | 'published' | 'failed';
  attemptCount: number;
  idempotencyKey: string;
  lastAttemptAt?: Date;
  publishedAt?: Date;
  error?: string;
  createdAt: Date;
}

const outboxSchema = new Schema<OutboxDoc>(
  {
    _id: { type: String, required: true },
    eventType: { type: String, required: true },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      enum: ['pending', 'publishing', 'published', 'failed'],
      required: true,
      default: 'pending',
    },
    attemptCount: { type: Number, required: true, default: 0 },
    idempotencyKey: { type: String, required: true },
    lastAttemptAt: { type: Date, required: false },
    publishedAt: { type: Date, required: false },
    error: { type: String, required: false },
    createdAt: { type: Date, required: true, default: () => new Date() },
  },
  { _id: false, versionKey: false, collection: OUTBOX_COLLECTION_NAME },
);

outboxSchema.index({ status: 1, createdAt: 1 });
outboxSchema.index({ idempotencyKey: 1 });
outboxSchema.index({ publishedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

/**
 * Bind the outbox schema to a connection. Idempotent — repeated calls
 * with the same connection return the cached model.
 */
export function getOutboxModel(connection: Connection): Model<OutboxDoc> {
  const modelName = '__OutboxEvent__';
  if (connection.models[modelName]) {
    return connection.models[modelName] as Model<OutboxDoc>;
  }
  return connection.model<OutboxDoc>(modelName, outboxSchema);
}

export type { OutboxDoc };

// Verify the namespace helper is available + signals failure for the
// `outbox.events` synthetic collection name (NOT a real service).
void namespace; // referenced so consumers see it via the barrel.
