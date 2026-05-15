# Phase-5b auth-service runtime research note

**Date:** 2026-05-15
**Phase:** 5b (Better-Auth runtime + plugin set)
**Workstream:** infra → auth
**Layer:** L4 (services/auth-service) + L5 (apps/api-gateway main.ts mount)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) `p5` todo
**Sub-plan:** [`.cursor/plans/p5b_auth_service_runtime_pr-15_4920fca6.plan.md`](../../.cursor/plans/p5b_auth_service_runtime_pr-15_4920fca6.plan.md)

PR-15 finishes what PR-14 scaffolded: registers the real Better-Auth instance as an async NestJS provider (dynamic-import-in-async-factory pattern, no `"type": "module"` cascade), wires Passkey/WebAuthn + 2FA TOTP + Phone OTP via MSG91 + Google social + email-verify / password-reset stubs, recreates `AuthServiceModule` + `AuthGuard`, and replaces the P4 `AuthMountStubController` with `expressApp.all('/api/auth/{*any}', toNodeHandler(auth))`. End result: `/api/auth/*` serves the real Better-Auth handler.

## 1. Sources reviewed (retrieval-dated 2026-05-15)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | better-auth on npm | <https://registry.npmjs.org/better-auth> | Latest 1.6.11 (published 2026-05-12). Built-in plugins `admin` / `organization` / `twoFactor` / `phoneNumber` exported from `better-auth/plugins`. `socialProviders.google` lives directly on the betterAuth options bag. |
| 2 | Better-Auth core docs | <https://www.better-auth.com/docs> | `betterAuth({ ... })` returns the instance; `auth.handler` is the Web Fetch handler; `auth.api.getSession({ headers })` is the typed session reader. ESM-only — confirmed against `package.json` `"type": "module"` field on the registry. |
| 3 | Better-Auth Mongo adapter | <https://www.better-auth.com/docs/adapters/mongo> | `mongodbAdapter(db, { client })` wires Better-Auth's collections (`user`, `session`, `account`, `verification`) into a Mongo database. Requires raw `mongodb` driver — not Mongoose. |
| 4 | Better-Auth Express integration | <https://www.better-auth.com/docs/integrations/express> | `toNodeHandler(auth)` adapts the Web Fetch handler to a Node Express handler. Must be mounted BEFORE `express.json()` because Better-Auth manages its own body parsing. |
| 5 | @better-auth/passkey on npm | <https://registry.npmjs.org/@better-auth/passkey> | Latest 1.6.11 (published 2026-05-12). Separate package from the `better-auth/plugins` built-ins. Imports: `import { passkey } from '@better-auth/passkey';` + browser `import { passkeyClient } from '@better-auth/passkey/client';`. WebAuthn extensions + pre-auth registration supported. |
| 6 | Better-Auth Passkey plugin docs | <https://www.better-auth.com/docs/plugins/passkey> | `passkey({ rpID, rpName, ... })` factory; client `addPasskey()` / `signIn.passkey()` / `deletePasskey()`. Mandatory-for-admin enforcement is policy-level (lands at P17/P18 onboarding wizards per parent plan). |
| 7 | Better-Auth Two-Factor docs | <https://www.better-auth.com/docs/plugins/2fa> | `twoFactor({ appName })`. TOTP (Google Authenticator etc.) + OTP + backup codes (encrypted by default — `storeBackupCodes` is "plain" / "encrypted" / custom). 30-second window ±1 for clock drift. Breaking change in v1.6: `method` param ("otp" \| "totp") on enable. |
| 8 | Better-Auth Phone Number plugin docs | <https://www.better-auth.com/docs/plugins/phone-number> | `phoneNumber({ sendOTP: async ({ phoneNumber, code }, ctx) => ... })`. Don't `await` the SMS-send in the callback (timing-attack mitigation) — use `waitUntil` on serverless or fire-and-forget on Oracle. Bug fix in late 2026 rethrows sendOTP failures correctly. |
| 9 | Better-Auth Google social provider docs | <https://www.better-auth.com/docs/authentication/google> | `socialProviders: { google: { clientId, clientSecret } }`. Callback URL `/<basePath>/callback/google` auto-derived from `baseURL`. v1.6 supports `clientId` as string OR string-array (web + iOS + Android cross-platform). |
| 10 | Better-Auth Email verification docs | <https://www.better-auth.com/docs/concepts/email> | `emailVerification.sendVerificationEmail({ user, url, token }, request)` + `emailVerification.sendOnSignUp: true`. `emailAndPassword.sendResetPassword({ user, url, token }, request)` + `emailAndPassword.onPasswordReset({ user }, request)`. Tokens expire after 1 hour by default. |
| 11 | NestJS dynamic-import (ESM-from-CJS) FAQ | <https://github.com/nestjs/docs.nestjs.com/issues/3093> | Pattern: `{ provide: TOKEN, useFactory: async () => (await import('esm-package')) }`. Requires `tsconfig.module: Node16` or `NodeNext` so TypeScript emits real `import()` instead of `require`. Our `@repo/typescript-config/nestjs.json` already uses Node16. |
| 12 | Better-Auth v1.6.0 release notes | <https://github.com/better-auth/better-auth/releases/tag/v1.6.0> | OpenTelemetry instrumentation (parked to P21 per `docs/research/phase-5b-auth-runtime.md` D-log D10), new social providers (WeChat ignored for MVP), improved session management, bug fixes. |
| 13 | MSG91 send-OTP REST API | <https://docs.msg91.com/otp> | `https://control.msg91.com/api/v5/otp` — POST with `authkey` header, `mobile` / `otp` / `template_id` / `sender` body. Returns `{ type: 'success' \| 'error' }`. 4-9 digit OTP length, 1-min to 1-day expiry. |
| 14 | NestJS Lifecycle events (`OnApplicationShutdown`) | <https://docs.nestjs.com/fundamentals/lifecycle-events> | `enableShutdownHooks()` (already called in `main.ts`) wires SIGTERM/SIGINT → `OnApplicationShutdown.onApplicationShutdown(signal)`. We close the `MongoClient` driving Better-Auth here. |
| 15 | `mongodb` driver on npm | <https://www.npmjs.com/package/mongodb> | Latest 6.20.x. `new MongoClient(uri).connect()` + `.db(name?)` + `.close()`. Lazy-connects on first op; explicit `connect()` warms the pool. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | CJS↔ESM interop pattern | Dynamic `await import('better-auth')` inside async `useFactory` providers | Convert services/auth-service + apps/api-gateway to `"type": "module"` | The `"type": "module"` cascade would force ESM-ifying Mongoose (CJS), nestjs-pino (CJS), nestjs-zod (CJS), Helmet (CJS), every spec file, and ts-jest's transform pipeline. Dynamic-import keeps the existing PR-13 bootstrap intact. `tsconfig.module: Node16` ensures TypeScript emits true `import()` not `require`. Source #11. |
| D2 | Passkey plugin source | `@better-auth/passkey` (separate package) | `passkey` from `better-auth/plugins` | npm registry check 2026-05-15 confirms `@better-auth/passkey@1.6.11` is the canonical package; `better-auth/plugins` does NOT export `passkey`. Importing it from the wrong subpath would fail at runtime. Source #5. |
| D3 | Provider lifecycle | `AUTH_MONGO_CLIENT_PROVIDER` opens the `MongoClient`; `AUTH_INSTANCE_PROVIDER` consumes it; `AuthServiceModule.onApplicationShutdown()` closes the client | Single combined provider | Separate providers let the module register the MongoClient as its own DI token so future tests can substitute a stub without monkey-patching the dynamic import. Matches PR-14's `AUTH_MONGO_CLIENT` symbol intent. |
| D4 | AuthGuard placement | Global `APP_GUARD` registered inside `AuthServiceModule` | Per-controller `@UseGuards(AuthGuard)` | Default-deny is safer (a forgotten decorator falls to 401 not anonymous access). Health + Better-Auth + Swagger paths get explicit `@AllowAnonymous()`. Carries the convention forward from `_old/apps/api/src/auth/auth.module.ts`. |
| D5 | Inline `nodeHeadersToFetchHeaders` helper | Inline 6-line helper in `auth.guard.ts` | `import { fromNodeHeaders } from 'better-auth/node'` | The guard runs in the gateway's CJS context; importing the ESM-only `better-auth/node` would force the same dynamic-import dance inside `canActivate()` which is awkward. The helper is trivial (iterate `req.headers`, push to `new Headers()`, return). Same approach `_old/apps/api/src/auth/better-auth.guard.ts` would have needed if it had been CJS. |
| D6 | MSG91 wrapper location | Inline `services/auth-service/src/msg91.ts` helper for MVP | Wait for P12 `@repo/notification-service` | P12 doesn't ship until phase 12 (months out). Better-Auth needs the `sendOTP` callback registered NOW so the `phoneNumber` plugin is functional. The helper is ~30 lines and a clear TODO points to the P12 migration target. Dev-default: log + return when MSG91_AUTH_KEY is unset (keeps local dev working without paid credentials). |
| D7 | Email callbacks (verify + reset) | Stub (log + return). `emailVerification.sendOnSignUp: true`. `emailAndPassword.requireEmailVerification: false`. | Block on P12 OR require email verification immediately | Same rationale as D6 — register the callback now so the API surface is correct; real delivery + enforcement land at P12 + the onboarding wizards at P17/P18. Strict enforcement (`requireEmailVerification: true`) would block all sign-ins until P12, which blocks every consumer phase. |
| D8 | Plugin mandatory-vs-optional enforcement | Plugins registered globally; mandatory-for-admin / optional-for-vendor enforcement is policy-level in P17/P18 onboarding wizards | Hard-code role-based plugin gating in `build-better-auth-instance.ts` | The plugin layer should expose the API uniformly; the role-based gating belongs at the UI flow (admin wizard refuses to complete without passkey registration). Better-Auth's plugin model is "available-or-not", not "available-for-some-roles" — gating belongs at the UX layer. Parent plan §5b "Better-Auth additional plugins" item 6 explicitly notes the deferral. |
| D9 | `as any` cast at the plugins boundary | Accepted — extends the precedent set in PR-14 `auth.factory.ts` | Express the union type explicitly | The intersection of admin + organization + passkey + twoFactor + phoneNumber + Google plugin type augmentations isn't expressible cleanly (admin tightens `email` to required, organization keeps it optional, etc.). Per the parent prompt convention guidance, we cast at the boundary + document inline. |
| D10 | Better-Auth OpenTelemetry wiring (v1.6 new) | Parked to P21 (observability hardening) | Wire into `@repo/observability` now | P21 owns the OTEL roadmap; wiring Better-Auth's instrumentation in isolation creates a dangling integration with no dashboards / alert-rules. Tracked as Open Question Q1. |
| D11 | Google `clientId` shape | Single string (string \| string-array supported in v1.6) | Array (web + iOS + Android upfront) | No mobile apps in MVP. Parent plan's mobile-apps section in `docs/runbooks/scaling-up.md` is the trigger for adding iOS + Android client IDs. Single string keeps the env-var simpler today. |
| D12 | Cross-subdomain SSO | No change — already wired in PR-14's `auth.factory.ts` via `advanced.crossSubDomainCookies` | Add Playwright E2E test here | E2E test lands at P16 (web-customer phase) when there's an actual second subdomain to assert against. Tracked as Open Question Q2. |
| D13 | Phase 5 + Phase 5b shipping pair | Close BOTH the Phase 5 MVP epic/acceptance + the new Phase 5b epic/acceptance at the end of PR-15. Close Phase 5 milestone (#6). Parent plan `p5` flips to `completed`. | Keep P5 todo `in_progress` until a separate P5b sub-todo lands | The parent prompt explicitly directs `p5 → completed` at PR-15 merge — Phase 5 + Phase 5b are a logical pair. |
| D14 | Nest framework deps as peer | `@nestjs/common`, `@nestjs/core`, `reflect-metadata`, `rxjs` declared as `peerDependencies` (mirrored as `devDependencies` for typechecking) | Plain `dependencies` | Plain deps double-installed `@nestjs/core` (11.1.21 in auth-service + 11.1.11 in api-gateway), which means `Reflector` + `APP_GUARD` symbols came from different module instances and DI failed to resolve. Peer-deps force the consumer to provide a single shared copy. Matches the pattern in `services/notification-service/package.json` + `services/order-service/package.json`. |
| D15 | Better-Auth collection isolation | Separate database `lotusgift_auth` for Better-Auth-owned collections (`user`, `session`, `account`, `verification`, plugin tables) | Inline collection-prefix override via schema | Better-Auth's mongo adapter doesn't expose a collection-prefix option; the cleanest isolation is a separate database. Atlas M0 free tier allows multiple databases on a single cluster (the 512 MB quota is cluster-wide, not per-database), so no cost impact. Keeps Better-Auth's bare collection names from colliding with the repo's service-namespaced convention (`<service>.<entity>` per `.cursor/rules/deployment-mode.mdc`). |
| D16 | MSG91 partial-config handling | All three of `MSG91_AUTH_KEY` / `MSG91_TEMPLATE_ID` / `MSG91_SENDER_ID` required together. Silent dev-skip only when ALL THREE are unset AND NODE_ENV ≠ production. Production with any unset → fail-fast with descriptive error. | Silent skip on `MSG91_AUTH_KEY` alone | Silently dropping `template_id` / `sender` would cause every MSG91 API call to 4xx with a confusing error. Fail-fast at config time is operator-friendlier. |
| D17 | Email + verification stub redaction | Stubs log only the redacted user email (`a***@example.com`), never the URL containing the token | Log the full reset/verification URL | The URL contains a single-use bearer token that completes the action; logging it leaks credentials to anyone with log access. Even temporary stubs need to respect the secrets-handling rule. |
| D18 | Adapter-agnostic node-handler type | `AuthNodeHandler` defined as `(req, res, next?) => void \| Promise<void>` with `req`/`res` as `unknown` | `Express.RequestHandler` import | The auth-service library shouldn't depend on the gateway's chosen platform adapter (Express today, possibly Fastify later). The narrow signature matches both. Removes the `express` runtime dep from `services/auth-service`. |

## 3. Open questions (parked)

- **Q1:** Better-Auth v1.6 OpenTelemetry instrumentation — wire to the `@repo/observability` bootstrap or leave for P21? **Parked decision:** leave for P21. Re-evaluate when the Grafana Cloud dashboards land.
- **Q2:** Cross-subdomain SSO Playwright E2E — `.lotusgift.com` cookie domain test lands at P16 when there's a second subdomain to assert against. Verified manually at P5b via curl + cookie inspection.
- **Q3:** Better-Auth admin impersonation audit log — events emit but aren't persisted. P21 (observability) adds the audit trail.
- **Q4:** Razorpay webhook raw-body capture — the `/api/payments/webhook` route still needs raw-body for HMAC verification. Currently `express.json()` runs after `toNodeHandler(auth)`. Per-route opt-out via middleware lands at P10 — not in scope here.
- **Q5:** WebAuthn rp/origin alignment in production — the `passkey({ rpID, rpName })` config wires to `env.BETTER_AUTH_URL` host. For dev (`localhost`) this is fine; production will need `lotusgift.com` (not `api.lotusgift.com`) so credentials work across all 4 frontend subdomains. Documented in `docs/runbooks/going-to-production.md` (cross-link to add post-merge).

## 4. Implementation checklist

- [x] research note
- [ ] Phase 5b Epic + Phase-Acceptance issues created under milestone #6
- [ ] `services/auth-service/src/build-better-auth-instance.ts` — async factory wiring all 6 plugins + Google + email stubs
- [ ] `services/auth-service/src/auth-service.module.ts` — async providers + APP_GUARD + OnApplicationShutdown
- [ ] `services/auth-service/src/auth.guard.ts` — Reflector + getSession + sets request.session/user
- [ ] `services/auth-service/src/msg91.ts` — sendMsg91Otp helper
- [ ] `services/auth-service/package.json` — add `better-auth`, `@better-auth/passkey`, `mongodb`, `@nestjs/core`, `express`
- [ ] `services/auth-service/src/index.ts` — barrel re-exports
- [ ] `packages/config/src/env.schema.ts` — 5 new optional env entries
- [ ] `.env.example` — 5 new entries
- [ ] `apps/api-gateway/src/main.ts` — replace stub with `toNodeHandler(auth)` mount + dynamic `better-auth/node` import
- [ ] `apps/api-gateway/src/app.module.ts` — import AuthServiceModule + drop AuthModule stub + bind ENV_TOKEN_NAME
- [ ] DELETE `apps/api-gateway/src/auth/auth.controller.ts` + `auth.module.ts`
- [ ] `apps/api-gateway/package.json` — add `@lotusgift/auth-service: workspace:*`
- [ ] `apps/api-gateway/Dockerfile` — add `services/auth-service` to deps + build stages
- [ ] `services/auth-service/src/auth.guard.spec.ts`
- [ ] `services/auth-service/src/auth-service.module.spec.ts`
- [ ] `services/auth-service/src/msg91.spec.ts`
- [ ] Local smoke pipeline (check-types + lint + test + build + dep-cruiser + markdownlint)
- [ ] PR-15 squash-merged + status sync

## 5. Versions captured

| Package | Specifier | Notes |
| --- | --- | --- |
| `better-auth` | `^1.6.11` | Core Better-Auth + organization + admin + twoFactor + phoneNumber plugins (all built-in via `better-auth/plugins`) |
| `@better-auth/passkey` | `^1.6.11` | Passkey/WebAuthn plugin (separate package per source #5) |
| `mongodb` | `^6.21.0` | Raw driver for the Better-Auth Mongo adapter (pinned to 6.x to match `@repo/database` mongoose transitive) |
| `@nestjs/common` | `^11` (peer) | Peer-dep so the service library shares Nest singletons with the gateway (decision D14 below) |
| `@nestjs/core` | `^11` (peer) | Same; peer-dep avoids double-install of `Reflector` + `APP_GUARD` |
| `reflect-metadata` | `^0.2` (peer) | Same |
| `rxjs` | `^7` (peer) | Same |

`pnpm ls --depth=0 --filter @lotusgift/auth-service` output (backfilled post-CLI-install):

```text
@lotusgift/auth-service@0.0.0 services/auth-service

dependencies:
@better-auth/passkey ^1.6.11
@repo/config workspace:* -> ../../packages/config
@repo/types workspace:* -> ../../packages/types
better-auth ^1.6.11
mongodb ^6.21.0

peerDependencies:
@nestjs/common ^11
@nestjs/core ^11
reflect-metadata ^0.2
rxjs ^7
```

## 6. Implementation reference

- **PR:** TBD — backfill after `gh pr create`
- **Squash SHA on `main`:** TBD — backfill after `gh pr merge --squash --admin`
- **Issues closed:** TBD — Phase 5b Epic + Phase-Acceptance + also closes Phase 5 MVP epic/acceptance (already closed in PR-14)
- **CI status:** TBD — 16 required checks expected green
- **Lessons learned:** TBD — backfill post-merge
- **What's actually ready for consumer use today:** TBD — backfill post-merge
