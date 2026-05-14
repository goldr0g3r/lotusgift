# Phase-5 services/auth-service research note

**Date:** 2026-05-14
**Phase:** 5 (MVP scope)
**Workstream:** infra → auth
**Layer:** L4 (services/auth-service) + L3 (packages/auth-client)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) `p5` todo

PR-14 ships the MVP slice of Phase 5: Better-Auth instance via the official `mongodbAdapter`, email/password + multi-session + 3 organization types (vendor-org / corporate-buyer-org / internal-staff-org) + admin plugin. Real handler mounted at `/api/auth/*` in `apps/api-gateway`, replacing the P4 stub. Browser SDK in `@repo/auth-client`.

DEFERRED to P5b (separate PR): Passkey/WebAuthn, 2FA TOTP + backup codes, Phone OTP via MSG91, Google social, email verification + password reset (waiting on P12 email infra), KYC + credit-limit underwriting (P6), cross-subdomain SSO Playwright test (P16).

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Better-Auth core docs | <https://www.better-auth.com/docs> | `betterAuth({ ... })` returns an instance; `auth.handler` is the Web Fetch handler; `auth.api.getSession({ headers })` is the typed session reader. |
| 2 | Better-Auth Mongo adapter | <https://www.better-auth.com/docs/adapters/mongo> | `mongodbAdapter(db, { client })` wires Better-Auth's collections (`user`, `session`, `account`, `verification`) into a Mongo database. |
| 3 | Better-Auth Organization plugin | <https://www.better-auth.com/docs/plugins/organization> | Multi-org membership; `organizationId` on session. Each user can belong to N orgs; the plugin exposes `organization.create()`, `organization.invite()`, etc. |
| 4 | Better-Auth Admin plugin | <https://www.better-auth.com/docs/plugins/admin> | Adds `role` field to users + `admin.listUsers()`, `admin.banUser()`, `admin.impersonate()` endpoints. We register it with `defaultRole: 'member'` + `adminRoles: ['admin']`. |
| 5 | `@thallesp/nestjs-better-auth` v2.x | <https://github.com/thallesp/nestjs-better-auth> | NestJS adapter; provides `BetterAuthModule.forRootAsync`, `AuthGuard`, `Session` decorator. We thin-wrap it so the Better-Auth instance + DI symbol live in `services/auth-service`. |
| 6 | Better-Auth Node helpers | <https://www.better-auth.com/docs/integrations/express> | `toNodeHandler(auth)` adapts the Fetch handler for express/Nest; `fromNodeHeaders(req.headers)` converts express headers into the Fetch Headers Better-Auth's `auth.api.getSession({ headers })` consumes. |
| 7 | Better-Auth client | <https://www.better-auth.com/docs/client> | `createAuthClient({ baseURL, plugins })` returns the browser-side client. `client.signIn.email()`, `client.signUp.email()`, `client.signOut()`, `client.getSession()`. |
| 8 | Better-Auth session cookie | <https://www.better-auth.com/docs/concepts/session> | Cookie name defaults to `better-auth.session_token`. Cross-subdomain SSO requires `advanced.crossSubDomainCookies.enabled: true` + `advanced.crossSubDomainCookies.domain: '.lotusgift.com'` — wired here for prod, dev defaults stay local-only. |
| 9 | Better-Auth `additionalFields` | <https://www.better-auth.com/docs/concepts/database#additional-fields> | Extends the `user` table with custom fields (`phone`, `orgKind`, `vendorOrgId?` etc.). Type-safe via the returned `auth.$Infer.Session.user` shape. |
| 10 | NestJS `OnApplicationShutdown` | <https://docs.nestjs.com/fundamentals/lifecycle-events> | Used by `AuthServiceModule` to close the Mongo connection driving Better-Auth (separate from the Mongoose connection driving domain queries; Better-Auth needs the raw `MongoClient` per source #2). |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | MVP scope split | Email/password + multi-session + 3 org types + admin plugin in this PR; Passkey/2FA/Phone OTP/Google/email-verify deferred to P5b | Single mega-PR | Mega-PR would be ~80 files + need email infra (P12) + MSG91 creds + Google OAuth client setup — all blockers. MVP slice unlocks P6+ services that depend on `@Session()` decorator + Mongo `user.id` references. |
| D2 | Better-Auth Mongo adapter wiring | New raw `MongoClient` connection (separate from the Mongoose connection in `@repo/database`) | Reuse the Mongoose connection | Better-Auth's `mongodbAdapter(db, { client })` expects a native `mongodb` driver `Db` + `MongoClient`, not a Mongoose `Connection`. Sharing isn't supported. The two connections target the same Atlas cluster, just different driver clients. |
| D3 | Organization plugin org types | Three: `vendor-org`, `corporate-buyer-org`, `internal-staff-org` (declared via `additionalFields` on the `organization` table) | Single org type with a `kind` discriminator field | The parent plan §4 mandates distinct workflows per org type — separate `kind` enum lets services route logic on org type without an additional table. |
| D4 | Admin plugin defaults | `defaultRole: 'member'`, `adminRoles: ['admin']` | `defaultRole: 'client'` (matches `_old`) | The `_old` codebase predates the org plugin; `client` was the generic-user role. With orgs in play, `member` is more accurate ("member of one or more orgs"). Admins are flagged independently. |
| D5 | AuthGuard placement | Global guard at the api-gateway level (registered via `APP_GUARD`); `@AllowAnonymous()` decorator opts endpoints out | Per-controller `@UseGuards(AuthGuard)` | Global default-deny is safer (forgot-to-decorate falls to 401 instead of accidental anonymous access). Health + Better-Auth + Swagger paths get explicit allow-anonymous. |
| D6 | `@Session` decorator | Returns the typed `auth.$Infer.Session` shape; throws if no session is on `request` | Returns `undefined` when missing | Throwing forces controller authors to either accept anonymous (via `@AllowAnonymous`) or work with a guaranteed session. Less defensive null-checking in service code. |
| D7 | `cookieCache` on session | Enabled (5-minute max-age) | Disabled | Reduces Mongo reads ~99 % for repeat requests within the cache window. Trade-off: invalidation on user role change has up to 5-min stale window — acceptable for the gateway's authz checks. |
| D8 | Browser client subpath | Default export from `@repo/auth-client` (server-safe — only imports Better-Auth client) | Server + browser split | Better-Auth's client is browser-only by design; no Node-specific entry point needed. The package's only purpose is wrapping `createAuthClient` with our org-plugin types. |
| D9 | Mounting position in main.ts | `toNodeHandler(auth)` mounted IMMEDIATELY after cookie-parser + Helmet but BEFORE express.json() | After express.json() | Better-Auth manages its own body parsing per source #6. Express.json() consuming the stream first breaks the handler. Matches the `_old` main.ts pattern. |
| D10 | trustedOrigins | Built from `env.FRONTEND_URL + env.FRONTEND_URLS` (comma-split) | Hardcoded | Same CORS allow-list as the gateway's `enableCors`; single source of truth via `@repo/config`. |

## 3. Open questions (parked for P5b / follow-up)

- **Q1:** Better-Auth schema migrations — Mongo is schemaless so initial setup is implicit. P21 may add an `infrastructure/scripts/ensure-auth-indexes.ts` to prebuild the indexes Better-Auth expects (`user.email`, `session.token`, etc.) — deferred until we see a real query cost.
- **Q2:** Cross-subdomain SSO `.lotusgift.com` cookie domain — wired via env var; production-only. Verified end-to-end in P16 Playwright test.
- **Q3:** Better-Auth admin impersonation audit log — currently events emit but aren't persisted to a dedicated audit collection. P21 (observability hardening) adds the audit trail.

## 4. Implementation checklist

- [x] research note
- [ ] Phase 5 Epic + Phase-Acceptance issues
- [ ] services/auth-service: createBetterAuth + 3 org types + admin plugin + AuthGuard + @AllowAnonymous + @Session + AuthServiceModule
- [ ] @repo/auth-client browser SDK
- [ ] apps/api-gateway: mount real toNodeHandler + import AuthServiceModule + delete stub
- [ ] Tests for createBetterAuth + AuthGuard + decorators
- [ ] Local smoke + CI green
- [ ] PR-14 squash-merged + status sync

## 5. Versions captured

| Package | Specifier | Notes |
| --- | --- | --- |
| `better-auth` | `^1.5.x` | Core Better-Auth + organization + admin plugins (built-in) |
| `mongodb` | `^6.x` | Raw driver for the Better-Auth adapter (separate from the Mongoose connection) |
| `@thallesp/nestjs-better-auth` | `^2.x` | NestJS guard + decorator + module wrappers |

## 6. Implementation reference

Filled after merge.
