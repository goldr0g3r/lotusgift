# `@repo/feature-flags`

LotusGift v2's L3 feature-flag client. Wraps PostHog's flag evaluation (`posthog-node` server, `posthog-js` browser) with a 60-second LRU cache on the server so per-request resolution doesn't HTTP-roundtrip to PostHog every time.

## Module map

| Subpath | Use when |
| --- | --- |
| `@repo/feature-flags/server` (default) | Service code + the gateway (`apps/api-gateway`). |
| `@repo/feature-flags/browser` | Next.js client components. |

## Server recipe

```ts
import { createServerFlagClient } from '@repo/feature-flags/server';

const flags = createServerFlagClient({
  apiKey: env.POSTHOG_KEY,
  host: env.POSTHOG_HOST,
  cacheTtlMs: 60_000,
});

const enabled = await flags.isEnabled('vendor-tier-upsell-banner', {
  distinctId: user.id,
  groups: { organization: orgId },
  personProperties: { tier: vendorTier },
});

// OnApplicationShutdown:
await flags.shutdown();
```

Cache semantics:

- Key: `(flag, distinctId, JSON(groups+personProperties))`.
- TTL: 60 s default; override per-instance.
- Size: 10_000 entries default.
- Bypass: `flags.clearCache()` for force-refresh (e.g. after a known flag rollout).

## Browser recipe

```ts
import { subscribeFlags, getFlag, isFlagEnabled } from '@repo/feature-flags/browser';
import { initBrowserAnalytics } from '@repo/analytics-sdk/browser';

initBrowserAnalytics({ apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY! });

// React app (per-app hook wrapper, in apps/web-*):
useEffect(() => {
  return subscribeFlags((snapshot) => {
    setFlagState(snapshot);
  });
}, []);

if (isFlagEnabled('checkout-v2')) { /* ... */ }
```

React hooks live in each consuming app (not this package) so we don't pull a React peer-dep into L3.

## Local-evaluation upgrade path

PostHog server-side local evaluation (downloads flag definitions every 30 s, evaluates locally without per-request HTTP) is supported by `posthog-node` but parked here for P21 (scale opt). The 60-second cache covers the MVP case without the additional moving part.

## L3 placement

Imports `posthog-node`, `posthog-js`, `lru-cache` (L0 npm). Does NOT import NestJS, React, or Next.js. The Nest provider + React hook wrappers live at L4/L6.
