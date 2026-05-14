import { IsoDateTimeSchema, UlidSchema, z } from '@repo/validators';

/**
 * Base envelope wrapped around every domain event published via
 * `OutboxPort` per `.cursor/rules/event-driven-discipline.mdc`.
 *
 * Carries:
 * - `__schemaVersion` — `MAJOR.MINOR` string; bump MINOR for additive
 *   changes, MAJOR for breaking. Consumers MUST tolerate unknown
 *   payload fields and reject on unknown MAJOR.
 * - `idempotencyKey` — `<entity>:<id>:<event>:<seq>` deduplicates
 *   re-deliveries downstream.
 * - `eventId` — globally unique ULID; the consumer's dedup key of last
 *   resort.
 * - `occurredAt` — when the domain change happened (NOT when the event
 *   was published).
 * - `correlationId` / `causationId` — distributed-trace correlation +
 *   event-chain pedigree.
 * - `actor` — who/what triggered the change; optional for
 *   system-emitted events (cron jobs, reconciliation sweeps).
 */
export const BaseEventEnvelopeSchema = z.object({
  __schemaVersion: z
    .string()
    .regex(/^\d+\.\d+$/, 'Schema version must be MAJOR.MINOR (e.g. "1.0")'),
  idempotencyKey: z.string().min(1),
  eventId: UlidSchema,
  occurredAt: IsoDateTimeSchema,
  correlationId: z.string().optional(),
  causationId: z.string().optional(),
  actor: z
    .object({
      kind: z.enum(['user', 'service', 'system', 'admin-impersonation']),
      id: z.string(),
      orgId: z.string().optional(),
    })
    .optional(),
});

export type BaseEventEnvelope = z.infer<typeof BaseEventEnvelopeSchema>;
