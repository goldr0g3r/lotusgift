---
name: P3b L3 analytics + feature flags PR-12
overview: Polish @repo/analytics-sdk (PostHog browser + server wrappers) + @repo/feature-flags (PostHog flag client) + event taxonomy doc in a single PR (PR-12). Autonomously built per user direction; same full-polish-in-one-PR pattern as PR-9 through PR-11.
todos:
  - id: research-note-p3b
    content: Write docs/research/phase-3b-analytics-flags.md with retrieval-dated 2026-05-14 citations.
    status: in_progress
  - id: phase-3b-issues
    content: Create Phase 3b Epic + Phase-Acceptance issues under Milestone 4.
    status: pending
  - id: analytics-sdk-package
    content: Populate @repo/analytics-sdk server + browser entrypoints + PII redactor wiring + README.
    status: pending
  - id: feature-flags-package
    content: Populate @repo/feature-flags server + browser flag client + cache + React-free hooks API + README.
    status: pending
  - id: event-taxonomy-doc
    content: Create docs/analytics/events.md with corporate-gifting event catalog.
    status: pending
  - id: tests-p3b
    content: Add unit tests + jest.config.cjs per package; 80% coverage threshold.
    status: pending
  - id: local-smoke-p3b
    content: Full local pipeline.
    status: pending
  - id: commit-push-pr-12
    content: Branch + commit + push + PR + Copilot + admin squash merge.
    status: pending
  - id: status-sync-pr12
    content: Post-merge status sync.
    status: pending
isProject: false
---

# Sub-plan: P3b L3 analytics + feature flags (PR-12)

Autonomous execution per user direction. Decisions baked from past PR patterns + the `.cursor/rules/analytics-instrumentation.mdc` constraints.

## Decisions baked in

- **Scope:** single PR-12, mirrors PR-9/PR-10/PR-11 cadence.
- **Subpath exports:** each package exposes `./server` + `./browser` entrypoints. The server entry is pure Node (`posthog-node`), the browser entry pulls in `posthog-js`. Consumers subpath-import to keep the browser bundle from accidentally pulling the Node SDK.
- **PII redaction:** every server-side `analytics.capture()` routes the `properties` object through `@repo/utils/redact()` before forwarding to PostHog per `.cursor/rules/analytics-instrumentation.mdc`.
- **Feature flags:** server uses `posthog-node`'s built-in flag evaluation; browser uses `posthog-js`'s `onFeatureFlags()` callback. Local-evaluation cache deferred to P21 (scale opt).
- **No React hooks at L3:** React hooks live in the consuming app (`apps/web-*`) since they import `react`. L3 packages export the framework-agnostic primitives only.
- **Drop `"type": "module"`** matching PR-10/PR-11 L1/L2 packages.

## Files (~30 across 2 packages + tests + research note + GitHub)

### `@repo/analytics-sdk`
- `src/server.ts` — `createServerAnalytics({ apiKey, host, flushAt, flushInterval })` returns `{ capture, identify, shutdown, flush }`. Wraps `posthog-node`. `capture()` runs `properties` through `@repo/utils/redact()` first. Event name validator asserts `[object] [verb]` lowercase format.
- `src/browser.ts` — `initBrowserAnalytics({ apiKey, host, defaults? })` calls `posthog.init` once + returns the client. `capture` + `identify` re-exports.
- `src/event-name.ts` — `assertValidEventName(name)` throws if name doesn't match `^[a-z][a-z0-9 ]+ [a-z]+$` (object + space + verb). Used by both entries.
- `src/index.ts` — barrel re-exports the server entry (default for Node consumers).
- `package.json` — subpath exports for `./server`, `./browser`, plus default. Deps: `posthog-node ^5.x`, `posthog-js ^1.x`, `@repo/utils: workspace:*`. Drop `"type": "module"`.
- `README.md` — recipe per `.cursor/rules/analytics-instrumentation.mdc`.

### `@repo/feature-flags`
- `src/server.ts` — `createServerFlagClient({ apiKey, host })`. Wraps `posthog-node`'s `isFeatureEnabled` + `getFeatureFlag` + `getAllFlags`. Includes a 60-second in-memory cache keyed on `(flag, distinctId, propertiesHash)` so per-request resolution doesn't hit PostHog every time.
- `src/browser.ts` — `subscribeFlags(handler)` wires PostHog's `onFeatureFlags` callback into a reactive store; consumers (Next.js apps) wrap it in their own React hook.
- `src/index.ts` — barrel.
- `package.json` — subpath exports. Deps: `posthog-node`, `posthog-js`. Drop `"type": "module"`.
- `README.md` — usage recipe + cache semantics.

### `docs/analytics/events.md`
- Catalog of LotusGift v2 events with their payload schemas (refs to `@repo/events/<service>` from P2). Format: `Event name | Trigger | Producer service | Consumer services | Required properties`. Covers corporate-gifting deltas (`order routed-to-rfq`, `mockup approved`, `recipient-list uploaded`, etc.).

### Tests
- `packages/analytics-sdk/src/event-name.test.ts` — `assertValidEventName` accepts canonical names, rejects camelCase, missing verb, etc.
- `packages/analytics-sdk/src/server.test.ts` — `capture()` redacts PII before forwarding to a stub `posthog-node`; `shutdown()` calls `client.shutdown()`.
- `packages/feature-flags/src/server.test.ts` — `isFlagEnabled()` caches results within TTL; cache-miss calls underlying client.

### Research note + GitHub
- `docs/research/phase-3b-analytics-flags.md` with ~10 retrieval-dated 2026-05-14 citations.
- Phase 3b Epic + Phase-Acceptance issues under milestone #4 (Phase 3 — L2 Infra + Analytics; P3b shares the milestone with P3 per milestone title).

### Post-merge
- Status sync via gh + MCP (project board fields, issue close, parent plan flip, research note §6).
