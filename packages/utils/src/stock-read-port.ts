/**
 * Cross-module stock-availability read port. First formalized
 * cross-module port in the codebase (per P7 PR-17 D12); the pattern is
 * documented in `docs/architecture/cross-service-contracts.md` and is
 * the template for ShippingRateReadPort (P11), TaxComputePort (P13),
 * PaymentCapturePort (P10), and NotificationDispatchPort (P12).
 *
 * Why a port at L2 vs direct cross-service `import`?
 *
 *   1. **Microservices-future-proof.** When inventory-service splits
 *      out of the modular monolith per `docs/runbooks/scaling-up.md`,
 *      the port stays the same — only the gateway DI binding swaps
 *      from `InProcessStockReadPort` to `RemoteHttpStockReadPort`.
 *      Product-service code doesn't change.
 *
 *   2. **Test ergonomics.** Product-service tests inject the stub
 *      (`StubStockReadPort` here) or a custom test double without
 *      pulling in the full inventory module's DI graph.
 *
 *   3. **Layer-graph compliance.** `@repo/utils` is L2; product-service
 *      (L4) consuming it doesn't violate any layer constraint. A
 *      direct `import { InventoryService } from '@lotusgift/inventory-service'`
 *      would either be allowed (L4 ↔ L4 public surface — see
 *      `vendor-active.guard.ts` D13 for the equivalent vendor case)
 *      OR rejected by `dep-cruiser`'s `no-cross-service-import` rule
 *      depending on the policy interpretation. Going through L2 sidesteps
 *      the ambiguity entirely.
 *
 * MVP wiring (P7 PR-17):
 *
 *   - `apps/api-gateway/src/app.module.ts` binds
 *     `{ provide: STOCK_READ_PORT, useClass: StubStockReadPort }`.
 *   - `services/product-service/src/services/product.service.ts`
 *     injects `@Inject(STOCK_READ_PORT) stock: StockReadPort` and uses
 *     `stock.batchGet(variantIds)` to populate `availableStock` on the
 *     product response.
 *
 * P8 inventory-service ships `RedisStockReadPort` (real Redis SUNION +
 * Mongo aggregate impl) + flips the gateway DI binding.
 */

/**
 * Per-variant stock snapshot returned by `StockReadPort.batchGet`.
 * `available` is the on-hand-minus-reserved count. `reserved` is the
 * count held by in-flight orders (P9 saga; TTL'd in Redis per P8).
 * `updatedAt` is the wall-clock time the snapshot was computed — read
 * callers can use it to render a "stock updated 3s ago" hint or to
 * decide whether to short-circuit a re-fetch.
 */
export interface StockSnapshot {
  readonly available: number;
  readonly reserved: number;
  readonly updatedAt: string;
}

/**
 * Cross-module stock-availability read contract.
 *
 * `batchGet` returns a `Map<variantId, StockSnapshot>` so callers can
 * read N variants in a single round-trip (matters at PDP load time
 * when a product has many variants; matters even more at PLP / search
 * when we want stock badges across the result page).
 *
 * Missing variants — variants the inventory-service doesn't know about
 * — are simply absent from the returned Map (NOT `null` entries). The
 * stub returns the same shape as the real impl: every requested
 * variantId is present with `{ available: 0 }` (so consumers can
 * iterate the Map without missing-key branching).
 */
export interface StockReadPort {
  batchGet(variantIds: readonly string[]): Promise<Map<string, StockSnapshot>>;
}

/**
 * DI token used by NestJS consumers to inject `StockReadPort`. The
 * provider registration lives in `apps/api-gateway/src/app.module.ts`
 * (this PR-17 binds the stub; P8 inventory-service swaps it for the
 * Redis-backed real impl).
 */
export const STOCK_READ_PORT = Symbol.for('@repo/utils#StockReadPort');

/**
 * Stub implementation — returns `{ available: 0, reserved: 0,
 * updatedAt: ISO-now }` for every requested variantId. Used at MVP
 * until P8 inventory-service ships the real Redis-backed reader.
 *
 * Consumers can rely on this shape: every variantId in the input array
 * has a corresponding entry in the returned Map (so iteration code
 * doesn't need missing-key branching).
 */
export class StubStockReadPort implements StockReadPort {
  async batchGet(variantIds: readonly string[]): Promise<Map<string, StockSnapshot>> {
    const now = new Date().toISOString();
    const snapshot: StockSnapshot = { available: 0, reserved: 0, updatedAt: now };
    const result = new Map<string, StockSnapshot>();
    for (const id of variantIds) {
      result.set(id, snapshot);
    }
    return result;
  }
}
