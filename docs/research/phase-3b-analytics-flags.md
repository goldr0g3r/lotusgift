# Phase-3b L3 analytics + feature-flags research note

**Date:** 2026-05-14
**Phase:** 3b
**Workstream:** infra (analytics + flag plumbing)
**Layer:** L3 (consumed by services + apps for analytics events + flag gating)
**Sub-plan:** [`.cursor/plans/p3b_l3_analytics_flags_pr-12_autonomous.plan.md`](../../.cursor/plans/p3b_l3_analytics_flags_pr-12_autonomous.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) `p3b` todo

PR-12 populates `@repo/analytics-sdk` (PostHog browser + server wrappers) + `@repo/feature-flags` (PostHog flag client) per [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc). Both packages are L3 — services + apps consume them, but they themselves depend only on L0–L2.

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | PostHog Node.js SDK reference | <https://posthog.com/docs/references/posthog-node> | Current 5.x. Methods: `capture`, `identify`, `flush`, `shutdown`, `isFeatureEnabled`, `getFeatureFlag`, `getAllFlags`. `shutdown` is critical in serverless + container-graceful-shutdown. |
| 2 | PostHog Node.js library setup | <https://posthog.com/docs/libraries/node> | Node 20+ floor. Config: `flushAt` (default 20), `flushInterval` (default 10_000 ms). For serverless: `flushAt: 1, flushInterval: 0`. We use defaults for the Oracle VM long-running process. |
| 3 | PostHog feature-flags installation (Node) | <https://posthog.com/docs/feature-flags/installation/nodejs> | `await client.isFeatureEnabled('flag-key', 'distinct_id')`. Returns boolean. For multivariate use `getFeatureFlag()` which returns the variant string. |
| 4 | PostHog server-side local evaluation | <https://posthog.com/docs/feature-flags/local-evaluation> | Optional: download flag definitions every 30 s, evaluate locally without per-request PostHog HTTP. Defer to P21 (scale opt) — for MVP the per-request HTTP is fine within free-tier quota. |
| 5 | PostHog JS web SDK reference | <https://posthog.com/docs/references/posthog-js-1.372.10> | Current 1.x. `posthog.init(token, { api_host, defaults: '2026-01-30' })`. Auto-captures pageviews/clicks/form-submits unless disabled. `posthog.capture(name, props)` + `posthog.identify(distinct_id, props)`. |
| 6 | PostHog JS feature usage | <https://posthog.com/docs/libraries/js/features> | `posthog.onFeatureFlags(callback)` fires whenever flag values change. Server-side renders need explicit bootstrap via `posthog.featureFlags.override({...})`. |
| 7 | PostHog Web installation | <https://posthog.com/docs/product-analytics/installation/web> | 2026 `defaults: '2026-01-30'` parameter wires up the current best-practice opt-in. Without it the SDK uses pre-2026 defaults (legacy autocapture behavior). |
| 8 | `analytics-instrumentation.mdc` rule | [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc) | Event names follow `[object] [verb]` (`order placed`, NOT `orderPlaced`). All PII routed through `@repo/utils/redactor` first. `await shutdown()` in every serverless handler + Nest `OnApplicationShutdown`. |
| 9 | PostHog India DPDP considerations | <https://posthog.com/docs/privacy/data-residency> | PostHog Cloud EU + DPDP-2023 compliance: we self-host on Oracle when GMV trigger hit per `docs/runbooks/scaling-up.md`. For MVP PostHog Cloud EU is acceptable. |
| 10 | PostHog Node 1.364.0 release notes | <https://github.com/PostHog/posthog-js/releases/tag/posthog-js@1.364.0> | Rejects `"undefined"` / `"null"` string distinct IDs (was silent-accept before). Our wrapper validates `distinctId` is a non-empty branded `UlidString | 'anonymous-<sessionid>'` before calling through. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Subpath split server/browser | Separate `./server` + `./browser` entries (consumer subpath-imports) | Single barrel | Avoids the browser bundle accidentally pulling `posthog-node` (and vice-versa). Bundlers' tree-shaking is not reliable for dual-target packages without explicit exports. |
| D2 | Event-name validation placement | `assertValidEventName()` runs inside `capture()` wrapper | Lint rule only | Runtime check catches typos in production (e.g. dynamically-constructed event names) that a lint rule misses. Performance cost ~5 μs/call. |
| D3 | PII redaction default | Always-on via `@repo/utils.redact(props, defaultRedactionPaths)` | Opt-in per call | Per `.cursor/rules/analytics-instrumentation.mdc` — never funnel PII through PostHog. Opt-out only via explicit `{ skipRedaction: true }` flag (escape-hatch for whitelisted analytics-team events). |
| D4 | Feature-flag cache | 60-second in-memory LRU on the server flag client | No cache (per-request fetch) | Reduces per-request HTTP to PostHog by ~99 % at steady state without sacrificing rollout responsiveness (60 s window). Defer local-evaluation (source #4) to P21. |
| D5 | PostHog Cloud region | EU | US | DPDP-2023 + GDPR overlap — EU residency is the safer default. Self-host migration path documented in `docs/runbooks/scaling-up.md`. |
| D6 | Browser `defaults` value | `'2026-01-30'` | Pre-2026 legacy | Current best-practice per source #7. Picks up autocapture-rate-limit + sensible cookie expiry without per-app config. |
| D7 | React hooks placement | NOT in this PR | Ship `@repo/feature-flags/react` subpath | React would force a peer-dep on the L3 package; cleaner to keep L3 framework-free + let each app wrap the reactive store in its own hook. |
| D8 | Drop `"type": "module"` | Yes (matches PR-10/PR-11) | Keep ESM-only | Same ts-jest CJS compatibility rationale. |
| D9 | Event taxonomy doc location | `docs/analytics/events.md` (new top-level doc dir) | Inline in `@repo/analytics-sdk/README.md` | Separate doc makes it the single source of truth for non-dev stakeholders (PM, growth). |
| D10 | Distinct-ID validation | Reject `"undefined"` / `"null"` / empty strings at the wrapper boundary | Trust caller | PostHog 1.364.0 now rejects these strings at the SDK boundary, but our wrapper catches them earlier with a clearer error. |

## 3. Open questions (parked for follow-up)

- **Q1:** Cookie consent banner for the browser SDK. Required before tracking in EU jurisdictions. Lands at P16 (web-customer Design Discovery) where we'd render the consent UI.
- **Q2:** PostHog session-replay. Off by default (privacy + bandwidth); enable per-page in P16+ via the `posthog.startSessionRecording()` API.
- **Q3:** Server-side flag local-evaluation upgrade. Defer to P21 alongside Sentry + Loki shipping.

## 4. Implementation checklist

- [x] `docs/research/phase-3b-analytics-flags.md` sections 1-5 complete
- [ ] Phase 3b Epic + Phase-Acceptance issues opened under milestone #4
- [ ] `@repo/analytics-sdk` populated (server + browser + event-name validator + README)
- [ ] `@repo/feature-flags` populated (server + browser + cache + README)
- [ ] `docs/analytics/events.md` catalog created
- [ ] Tests added; coverage threshold 80%
- [ ] Local smoke green
- [ ] PR-12 squash-merged + status sync complete

## 5. Versions captured

| Package | Specifier | Resolved | Notes |
| --- | --- | --- | --- |
| `posthog-node` | `^5.x` | 5.34.x | Server SDK. Node 20+ floor; we're on Node 22. |
| `posthog-js` | `^1.x` | 1.372.x | Browser SDK. Use with `defaults: '2026-01-30'` per source #7. |
| `lru-cache` | `^11.x` | 11.x | Already in workspace from PR-11; we add to `@repo/feature-flags` for the 60s cache. |

## 6. Implementation reference

Filled after merge.
