# Cross-Service Contracts

Per `.cursor/rules/deployment-mode.mdc`, LotusGift v2 deploys as a modular monolith — every business module is a Nest library under `services/<name>` hosted by the same `apps/api-gateway` process. Service modules **must not** directly import another service's internal types. Cross-module reads instead flow through **typed ports** declared at `@repo/utils` (L2) so:

1. When a service splits out of the monolith into its own process per `docs/runbooks/scaling-up.md`, the consumer doesn't change — only the gateway DI binding flips from `InProcess<X>Port` to `RemoteHttp<X>Port`.
2. Test ergonomics improve — consumers inject the stub or a custom test-double without pulling in the full producer module's DI graph.
3. The `dep-cruiser` `no-cross-service-import` rule stays unambiguously enforceable.

This doc captures the cross-module ports as they're formalized phase-by-phase. Each port is a TypeScript interface + a `Symbol.for(...)` DI token + a stub implementation, all exported from `@repo/utils`. Real implementations live in the producing service.

## Active ports

### `StockReadPort` — P7 (PR-17) — produced by P8 inventory-service

| | |
|---|---|
| **Interface** | `StockReadPort` in `packages/utils/src/stock-read-port.ts` |
| **DI token** | `STOCK_READ_PORT = Symbol.for('@repo/utils#StockReadPort')` |
| **Stub** | `StubStockReadPort` (returns `{ available: 0, reserved: 0, updatedAt: ISO-now }` for every variantId) |
| **Bound at** | `apps/api-gateway/src/app.module.ts` — `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }` |
| **Consumer** | `services/product-service/src/services/product.service.ts` — `@Inject(STOCK_READ_PORT) stock: StockReadPort` populates the `availableStock` field on `ProductResponse` |
| **Real impl ships in** | **P8 inventory-service** — `RedisStockReadPort` (Redis `SUNION` of per-warehouse on-hand counts + Mongo aggregate); the gateway DI binding flips `useClass: StubStockReadPort → useClass: RedisStockReadPort` at P8 |

#### Method signature

```typescript
interface StockReadPort {
  batchGet(
    variantIds: readonly string[],
  ): Promise<Map<string, { available: number; reserved: number; updatedAt: string }>>;
}
```

#### Stub semantics

Every requested `variantId` is present in the returned `Map` with `{ available: 0, reserved: 0, updatedAt: <ISO now> }`. Consumers can iterate the Map without missing-key branching.

#### Real-impl semantics (P8)

`available = on-hand - reserved`. `reserved` reflects in-flight Redis TTL reservations held by the P9 order-saga. `updatedAt` is the wall-clock time the Redis snapshot was read.

## Upcoming ports (proposed; land alongside their producing phase)

| Port | Token | Stub | Producer phase | Consumer phases |
|---|---|---|---|---|
| `ShippingRateReadPort` | `SHIPPING_RATE_READ_PORT` | returns empty quote map | P11 shipping-service | P9 order-service (cart shipping estimate) + P16 web-customer (PDP "ships from" hint) |
| `TaxComputePort` | `TAX_COMPUTE_PORT` | returns 0% GST + null HSN-validation | P13 tax-service | P9 order-service (order-line tax) + P10 payment-service (invoice total) |
| `PaymentCapturePort` | `PAYMENT_CAPTURE_PORT` | always returns `{ status: 'failed', reason: 'STUB' }` | P10 payment-service | P9 order-service (order-saga capture step) |
| `NotificationDispatchPort` | `NOTIFICATION_DISPATCH_PORT` | logs the dispatch + returns success | P12 notification-service | every L4 service that emits an outbox event consumed by P12 |

Each port follows the same pattern as `StockReadPort`:

1. Declare the interface + token + stub at `@repo/utils` (L2) in the **consuming** phase's PR.
2. Bind the stub at `apps/api-gateway/src/app.module.ts` via `useClass: Stub<X>Port`.
3. Producing phase ships the real implementation in `services/<producer>` + flips the gateway DI binding to `useClass: <Real><X>Port` in the same PR.

This sequencing means the consuming phase can ship + test (with the stub) BEFORE the producing phase exists, so dependent phases parallelize cleanly.

## When to add a port (vs direct cross-module import)

Add a port whenever a service needs to **read state owned by another service**. The exception (and the only currently-sanctioned cross-service import) is when the producing service exposes a guard / decorator that the consumer needs to wire at controller mount time — e.g. `VendorActiveGuard` in `services/product-service/src/decorators/` imports `VendorService` from `@lotusgift/vendor-service` directly because:

- The guard runs INSIDE a controller's `@UseGuards(...)` decorator at module bootstrap time, before any request arrives.
- The dependency is a guard contract, not a data read.
- Splitting it into a port would require the producer to ship both the impl AND a same-signature stub for the consumer to bind — pure overhead for zero swap-out value.

If in doubt: prefer the port pattern. The marginal cost of one extra interface + stub is far less than the cost of unwinding a direct import at scale-up time.

## References

- `.cursor/rules/architecture-layers.mdc` — L0–L6 import direction
- `.cursor/rules/microservice-boundaries.mdc` — service-to-service allow-list
- `.cursor/rules/deployment-mode.mdc` — modular monolith first
- `.cursor/rules/event-driven-discipline.mdc` — writes go through `OutboxPort.publish` (a different cross-module port for writes; this doc covers reads)
- `docs/runbooks/scaling-up.md` — when to split a service out of the monolith
- `docs/research/phase-7-product-service.md` D12 — StockReadPort introduction rationale
