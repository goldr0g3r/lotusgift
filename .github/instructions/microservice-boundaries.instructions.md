---
applyTo: "services/**/*.ts"
---

# Microservice Boundaries

Each `services/<name>` Nest library must be **swap-out-able to its own process** without code changes. That means it imports only from a fixed allow-list of L1–L3 packages.

## Allowed imports

`@repo/types`, `@repo/validators`, `@repo/events`, `@repo/utils`, `@repo/database`, `@repo/config`, `@repo/observability`, `@repo/analytics-sdk` (server entry only), `@repo/feature-flags` — and Nest framework packages.

## Cross-service communication

- **Reads** → call the gateway's typed client at `@repo/api/internal` (Kubb-emitted, internally namespaced).
- **Writes** → publish an outbox event via `OutboxPort.publish(event, { transactionId })` in the same Mongo transaction.
- **Public-surface re-use (P7 D12/D13 exception)** → importing from a sibling service's **package public surface** (`@lotusgift/<service>`, resolving to `services/<service>/src/index.ts`) IS allowed when re-using shared decorators (`RequireRole`, `RoleGuard`) or read-only service classes (`VendorService.getByOrgId()` for ownership guards). Reaching past `index.ts` into internal paths is still forbidden. The `dep-cruiser` `no-cross-service-import` rule enforces the index.ts boundary explicitly.

## Do

- Inject `@Inject(OUTBOX_PORT) outbox: OutboxPort` and publish from there.
- Subscribe to events in the consuming service's module bootstrap, not at class-init time.
- Validate inbound event payloads with the schema from `@repo/events`.

## Don't

- `import { OrderService } from '../order-service/src/order.service';` — direct cross-service import.
- Reach into another service's Mongo collection — go through its API or events.

## Concrete example

```ts
// ❌ services/notification-service/src/notification.service.ts
import { OrderService } from '../../order-service/src';

// ✅
@OnEvent('order.placed.v1')
async onOrderPlaced(event: OrderPlacedV1) {
  const validated = OrderPlacedV1Schema.parse(event);
  await this.sendOrderConfirmation(validated);
}
```

## References

[docs/research/phase-0-rules.md](../../docs/research/phase-0-rules.md) — works hand-in-hand with `architecture-layers` and `event-driven-discipline`.
