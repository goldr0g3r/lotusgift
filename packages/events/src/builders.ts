import { z, type ZodTypeAny } from '@repo/validators';

import { BaseEventEnvelopeSchema } from './envelope.js';

/**
 * Declare a domain event schema. Wraps `payloadSchema` in the standard
 * `BaseEventEnvelopeSchema` and attaches a `type` discriminator literal
 * so consumers can dispatch on `event.type`.
 *
 * @example
 * ```ts
 * // packages/events/src/order/placed.v1.ts
 * import { defineEvent } from '@repo/events';
 * import { z, InrPaiseSchema, UlidSchema } from '@repo/validators';
 *
 * export const OrderPlacedV1 = defineEvent(
 *   'order.placed.v1',
 *   z.object({
 *     orderId: UlidSchema,
 *     totalPaise: InrPaiseSchema,
 *   }),
 * );
 *
 * // services/order-service/src/order.service.ts
 * await this.outbox.publish(
 *   OrderPlacedV1.schema.parse({
 *     __schemaVersion: '1.0',
 *     idempotencyKey: `order:${order.id}:placed:1`,
 *     eventId: ulid(),
 *     occurredAt: new Date().toISOString(),
 *     type: 'order.placed.v1',
 *     payload: { orderId: order.id, totalPaise: total },
 *   }),
 *   { session },
 * );
 * ```
 */
export function defineEvent<TName extends string, TPayload extends ZodTypeAny>(
  name: TName,
  payloadSchema: TPayload,
) {
  const schema = BaseEventEnvelopeSchema.extend({
    type: z.literal(name),
    payload: payloadSchema,
  });

  return {
    /** Event name discriminator (e.g. `'order.placed.v1'`). */
    name,
    /** Full envelope-wrapped Zod schema with literal `type` field. */
    schema,
  } as const;
}

export type DefinedEvent<TName extends string, TPayload extends ZodTypeAny> = ReturnType<
  typeof defineEvent<TName, TPayload>
>;
