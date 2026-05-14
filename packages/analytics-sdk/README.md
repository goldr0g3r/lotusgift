# `@repo/analytics-sdk`

LotusGift v2's L3 PostHog wrapper. Thin facade over `posthog-node` (server) and `posthog-js` (browser) per [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc). Every server-side event is automatically PII-redacted via [`@repo/utils.redact`](../utils/src/redactor.ts).

## Module map

| Subpath | Use when |
| --- | --- |
| `@repo/analytics-sdk/server` (default) | Service code (`services/*`) + the gateway. Uses `posthog-node`. |
| `@repo/analytics-sdk/browser` | Next.js client components (`apps/web-*`). Uses `posthog-js`. |

## Server recipe

```ts
import { createServerAnalytics } from '@repo/analytics-sdk/server';
import { loadEnv } from '@repo/config';

const env = loadEnv(process.env);
const analytics = createServerAnalytics({
  apiKey: env.POSTHOG_KEY,
  host: env.POSTHOG_HOST,
});

analytics.capture({
  distinctId: order.buyerId,
  event: 'order placed',
  properties: { order_id: order.id, gmv_paise: order.totalPaise, route: 'cart' },
});

// In OnApplicationShutdown (P4) + every serverless handler exit:
await analytics.shutdown();
```

## Browser recipe

```ts
// apps/web-customer/app/providers.tsx (P16)
'use client';
import { initBrowserAnalytics, captureBrowser } from '@repo/analytics-sdk/browser';

initBrowserAnalytics({ apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY! });
captureBrowser('hero scrolled', { variant: 'A' });
```

`initBrowserAnalytics` is idempotent — safe to call from React `useEffect` on every mount.

## Event-name format

Per [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc), events follow `[object] [verb]` in lowercase. The wrapper validates the format at every `capture()` call:

```ts
analytics.capture({ distinctId: 'u1', event: 'order placed' });     // ok
analytics.capture({ distinctId: 'u1', event: 'orderPlaced' });      // throws InvalidEventNameError
analytics.capture({ distinctId: 'u1', event: 'recipient-list uploaded' }); // ok (kebab-case object)
```

See [`docs/analytics/events.md`](../../docs/analytics/events.md) for the full LotusGift event catalog.

## PII redaction

Server-side `capture()` runs `properties` through [`@repo/utils.redact`](../utils/src/redactor.ts) with the default redaction paths before forwarding to PostHog. This is on by default and the rule mandates it; opt out only when the analytics team has whitelisted an event (extremely rare):

```ts
analytics.capture({
  distinctId: 'u1',
  event: 'pii whitelisted_event',
  properties: { foo: 'bar' },
  skipRedaction: true, // emergency escape hatch
});
```

Browser-side `captureBrowser()` does NOT auto-redact — PostHog's browser SDK runs in the user's browser, and any PII it sees came from the user themselves. Server-side enforcement is what stops system-emitted PII from leaking.

## Distinct-ID validation

PostHog 1.364.0 rejects string `"undefined"` / `"null"` distinctIds; our wrapper catches them earlier with a clearer error. Convention:

- Authenticated user: `user.id` (ULID from `@repo/types`).
- Anonymous traffic: `'anonymous-' + sessionId`.

## L3 placement

Imports `posthog-node`, `posthog-js` (L0 npm) + `@repo/types`, `@repo/utils` (L1–L2 siblings). Does NOT import NestJS, Next.js, or React — those layers wrap this primitive at L4/L6.
