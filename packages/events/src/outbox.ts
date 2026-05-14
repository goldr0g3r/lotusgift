import { IsoDateTimeSchema, UlidSchema, z } from '@repo/validators';

/**
 * Outbox row stored in the Mongo `outbox` collection. Written in the
 * same transaction as the domain row that produced it
 * (`.cursor/rules/event-driven-discipline.mdc`). A relayer polls the
 * collection, publishes each row's event to the in-process EventEmitter
 * (MVP) or message bus (post-MVP), and marks the row `published`.
 *
 * Failure modes:
 * - `pending` → relayer hasn't picked it up yet.
 * - `failed` + non-null `lastAttemptAt` + `error` → relayer tried and
 *   gave up after `attemptCount` retries; surfaced in the admin
 *   dashboard for manual intervention.
 *
 * `payload` is intentionally `z.unknown()` — each event has its own
 * schema (`@repo/events/<service>/<event-name>.v1.ts`) and the publish
 * callsite validates against that schema BEFORE writing the outbox row.
 */
export const OutboxRowSchema = z.object({
  _id: UlidSchema,
  eventType: z.string().min(1),
  payload: z.unknown(),
  status: z.enum(['pending', 'published', 'failed']),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptAt: IsoDateTimeSchema.optional(),
  publishedAt: IsoDateTimeSchema.optional(),
  error: z.string().optional(),
  createdAt: IsoDateTimeSchema,
});

export type OutboxRow = z.infer<typeof OutboxRowSchema>;
