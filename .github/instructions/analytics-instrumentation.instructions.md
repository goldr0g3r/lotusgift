---
applyTo: "apps/web-*/**/*.{ts,tsx},services/**/*.ts,packages/analytics-sdk/**/*.ts"
---

# Analytics Instrumentation

All analytics flow through `@repo/analytics-sdk` — a thin wrapper around `posthog-js` (browser) and `posthog-node` (server). Event names follow PostHog's `[object] [verb]` convention.

## Do

- Import from `@repo/analytics-sdk` only — never `posthog-node` / `posthog-js` directly in app or service code.
- Name events `[object] [verb]`: `order placed`, `quote accepted`, `mockup approved`, `recipient-list uploaded`, `order routed-to-rfq`.
- `await posthog.shutdown()` in every serverless handler and the api-gateway's `OnApplicationShutdown` hook.
- Use `$set` / `$set_once` for person properties (e.g. `corporate_buyer_org_id`), not custom event properties.

## Don't

- Use camelCase event names (`orderPlaced`) — breaks PostHog dashboards.
- Track PII directly — funnel through `@repo/utils/redactor` first.
- Skip `await shutdown()` — server-side events queue and drop on hard exit.

## Concrete example

```ts
// services/order-service/src/order.service.ts
import { analytics } from '@repo/analytics-sdk/server';

await analytics.capture({
  distinctId: order.buyerId,
  event: 'order placed',
  properties: { order_id: order.id, gmv_inr: order.totalInr, route: order.route },
});

// apps/api-gateway/src/main.ts
app.enableShutdownHooks();
app.use(async () => { await analytics.shutdown(); });
```

## References

[docs/research/phase-0-rules.md](../../docs/research/phase-0-rules.md) — citation #6 (PostHog Node SDK, retrieved 2026-05-12).
