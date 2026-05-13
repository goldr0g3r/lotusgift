---
applyTo: "services/**/*.ts,packages/events/**/*.ts,packages/utils/**/*.ts"
---

# Event-Driven Discipline

Every event schema in `@repo/events` carries `__schemaVersion` (semver `MAJOR.MINOR`) + idempotency key. Publication happens via `OutboxPort.publish(event, { transactionId })` **inside the same Mongo transaction** as the write that produced it. Never call `EventEmitter.emit()` from service code.

## Do

- Define the event schema in `packages/events/src/<service>/<event-name>.v1.ts` with `__schemaVersion: '1.0'`.
- Include an `idempotencyKey` field (typically `<entity>:<id>:<event>:<seq>`).
- Pass the active `transactionId` so the outbox row is committed atomically with the domain write.
- Bump `__schemaVersion` on every additive change; ship v2 alongside v1, retire v1 only after all consumers migrate.

## Don't

- Use `EventEmitter2.emit()` directly — bypasses the outbox + idempotency.
- Mutate an event payload after publish.
- Skip the `transactionId` — silent dual-write loss is the failure mode.

## Concrete example

```ts
// packages/events/src/order/placed.v1.ts
export const OrderPlacedV1 = z.object({
  __schemaVersion: z.literal('1.0'),
  idempotencyKey: z.string(),
  orderId: z.string().ulid(),
  totalInr: z.number().int(),
});

// services/order-service/src/order.service.ts
await this.db.session.withTransaction(async (session) => {
  const order = await this.orders.create([{ ... }], { session });
  await this.outbox.publish(
    { __schemaVersion: '1.0', idempotencyKey: `order:${order.id}:placed:1`, orderId: order.id, totalInr },
    { session },
  );
});
```

## References

[docs/research/phase-0-rules.md](../../docs/research/phase-0-rules.md); transport-agnostic Outbox pattern per parent plan §4.
