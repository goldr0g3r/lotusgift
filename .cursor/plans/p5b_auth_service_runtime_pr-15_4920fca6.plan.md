---
name: P5b auth-service runtime PR-15
overview: Finish what PR-14 scaffolded — wire the real Better-Auth instance via async dynamic-import providers in services/auth-service, recreate AuthServiceModule + AuthGuard, replace the api-gateway /api/auth/* stub with toNodeHandler(auth), and turn on Passkey + 2FA TOTP + Phone OTP (MSG91) + Google social + email-verify / password-reset stubs. Single PR-15, then flip parent plan p5 to completed.
todos:
  - id: research-note-p5b
    content: Write docs/research/phase-5b-auth-runtime.md with retrieval-dated 2026-05-15 citations covering Better-Auth 1.6, @better-auth/passkey, twoFactor + phoneNumber + Google social, NestJS dynamic ESM import pattern, MSG91 send-OTP API.
    status: in_progress
  - id: phase-5b-issues
    content: Create Phase 5b Epic + Phase-Acceptance issues under existing Phase 5 milestone (#6) with phase/P5,area/infra,epic + phase/P5,phase-acceptance labels.
    status: pending
  - id: branch-pr-15
    content: git checkout -b pr-15-auth-runtime + flip parent plan p5 todo content noting PR-15 is the PR-of-record.
    status: pending
  - id: deps
    content: Add better-auth ^1.6.x, @better-auth/passkey ^1.6.x, mongodb ^6.x, @nestjs/core ^11 to services/auth-service. Add @lotusgift/auth-service workspace dep to apps/api-gateway. Extend EnvSchema with MSG91_AUTH_KEY/TEMPLATE_ID/SENDER_ID + GOOGLE_OAUTH_CLIENT_ID/SECRET as optional.
    status: pending
  - id: build-better-auth-instance
    content: services/auth-service/src/build-better-auth-instance.ts — async factory that does dynamic import('better-auth') + import('better-auth/plugins') + import('better-auth/adapters/mongodb') + import('@better-auth/passkey'); wires admin + organization + passkey + twoFactor + phoneNumber + Google social + email-verify/reset stubs.
    status: pending
  - id: auth-module
    content: services/auth-service/src/auth-service.module.ts — registers AUTH_MONGO_CLIENT_PROVIDER + AUTH_INSTANCE_PROVIDER (both async useFactory) + AuthGuard provider + APP_GUARD binding. OnApplicationShutdown closes the MongoClient.
    status: pending
  - id: auth-guard
    content: services/auth-service/src/auth.guard.ts — Reflector reads ALLOW_ANONYMOUS_KEY; on miss calls auth.api.getSession with inline nodeHeadersToFetchHeaders helper (no better-auth/node import). Throws UnauthorizedException({ message, code: 'AUTH_INVALID_TOKEN' }).
    status: pending
  - id: msg91-stub
    content: services/auth-service/src/msg91.ts — minimal sendMsg91Otp(phone, otp) helper using global fetch. Reads MSG91_AUTH_KEY/TEMPLATE_ID/SENDER_ID from injected env; logs warn-and-noop if missing. TODO comment points at P12.
    status: pending
  - id: gateway-mount
    content: apps/api-gateway/src/main.ts — after cookie-parser + Helmet, BEFORE express.json(), dynamically import better-auth/node and mount expressApp.all('/api/auth/{*any}', toNodeHandler(auth)). Delete apps/api-gateway/src/auth/auth.controller.ts + auth.module.ts.
    status: pending
  - id: app-module-wire
    content: apps/api-gateway/src/app.module.ts — import AuthServiceModule.forRoot(env) (or import + provide ENV_TOKEN_NAME); drop the old AuthModule import.
    status: pending
  - id: tests
    content: services/auth-service/src/auth.guard.spec.ts + services/auth-service/src/auth-service.module.spec.ts (module compiles + AUTH_INSTANCE resolves with stubbed factory). No @jest/globals imports — ts-jest auto-injects. Use .spec.ts extension matching the existing nest jest testRegex.
    status: pending
  - id: dockerfile
    content: apps/api-gateway/Dockerfile — add services/auth-service/package.json to deps stage COPY + add services/auth-service directory copy in build stage. Same pattern as PR-13 + PR-14.
    status: pending
  - id: env-example
    content: .env.example — append MSG91_* + GOOGLE_OAUTH_* entries (names only).
    status: pending
  - id: smoke
    content: Local pipeline — pnpm install --no-frozen-lockfile + check-types + lint + test + build + dep-cruiser + markdownlint on new docs/plans.
    status: pending
  - id: commit-push-pr-15
    content: Single feat(auth) commit + branch push + gh pr create PR-15 with HEREDOC body summarizing scope/changes/tests/CI.
    status: pending
  - id: ci-poll
    content: gh pr checks 15 — poll 16 required checks (build-push is the longest ~5-7min). Use AwaitShell with 300-540s blocks.
    status: pending
  - id: copilot-review
    content: gh pr edit 15 --add-reviewer copilot-pull-request-reviewer; address every Copilot comment + re-poll CI.
    status: pending
  - id: admin-squash-merge
    content: gh pr merge 15 --squash --admin --subject ... --body via Set-Content tmpfile.
    status: pending
  - id: post-merge-sync
    content: Close epic + acceptance issues, close Phase 5 milestone (#6), flip parent plan p5 -> completed, backfill phase-5 + phase-5b research notes §6, sync project board, delete branch local + remote.
    status: pending
isProject: false
---

# Sub-plan: P5b auth-service runtime (PR-15)

Autonomous execution per parent prompt. Finishes what PR-14 scaffolded so the gateway's `/api/auth/*` endpoint serves the real Better-Auth handler instead of the 503 stub.

## Decisions baked in

- **CJS↔ESM interop pattern:** keep both `services/auth-service` and `apps/api-gateway` as CJS, use **dynamic `await import(...)`** inside async `useFactory` providers for every ESM-only Better-Auth subpath (`better-auth`, `better-auth/plugins`, `better-auth/adapters/mongodb`, `better-auth/node`, `@better-auth/passkey`). This avoids cascading `"type": "module"` through Mongoose + Pino + Helmet + nestjs-zod, which would require rewriting a significant chunk of PR-13's bootstrap. `tsconfig.json` already uses `module: Node16`, so TypeScript emits true `import()` calls (not `require`).
- **Plugin selection:** built-in plugins from `better-auth/plugins` for `admin`, `organization`, `twoFactor`, `phoneNumber`. Passkey lives in the separate `@better-auth/passkey` package (confirmed 2026-05-15 via npm registry — 1.6.11 latest). Google via `socialProviders: { google: ... }` directly on the betterAuth options bag.
- **MSG91 wrapper:** minimal `sendMsg91Otp(env, phone, otp)` helper in `services/auth-service/src/msg91.ts`. Uses global `fetch` (Node 22 ships with it). When `MSG91_AUTH_KEY` is unset (dev/test), it logs a warn-line + returns instead of throwing — keeps local-dev usable without paid credentials. TODO comment points at P12 `notification-service` migration.
- **Email callbacks:** `emailAndPassword.sendResetPassword` + `emailAndPassword.sendVerificationEmail` + `emailVerification.sendOnSignUp: true` all stubbed (log + return). TODO comment points at P12. `requireEmailVerification: false` stays — the strict enforcement lands when P12 brings real email delivery.
- **Mandatory passkey + 2FA enforcement** for admins / vendors / corporate-buyers is **policy-level** and lands at P17/P18 (the onboarding wizards). The plugins are registered globally here so the API is available — the gating UI flow that forces passkey-or-2FA on admin signup is not in scope.
- **Cross-subdomain SSO** is already wired in `auth.factory.ts` (PR-14) via `advanced.crossSubDomainCookies`. No change. E2E Playwright test lands at P16.
- **AuthGuard placement:** global `APP_GUARD` registered inside `AuthServiceModule` (the module declares itself as `@Module({ providers: [..., { provide: APP_GUARD, useClass: AuthGuard }] })` and exports the providers). Default-deny across the gateway; `@AllowAnonymous()` opts endpoints out (already used by `HealthController.liveness` / `readiness` + `LinksController` MVPs).
- **Test convention:** `.spec.ts` extension (matches the existing `jestConfig.testRegex = '.*\\.spec\\.ts$'`); no `@jest/globals` imports — ts-jest auto-injects per Jest 30 (the past-PR convention codified in the parent prompt). Module-compile test stubs the MongoClient + dynamic-import factory so we don't hit a real Atlas cluster.
- **No `area/auth` label:** confirmed via `gh label list` — only `area/infra` exists in the project label set. Same fallback PR-14 used.
- **Use existing Phase 5 milestone (#6):** P5b shares the milestone with P5. Both issues close at the end of P5b (Phase 5 + Phase 5b ship as a logical pair).

## File-by-file deliverables

### `services/auth-service/`

- `src/build-better-auth-instance.ts` — async factory. Signature: `async function buildBetterAuthInstance(env: Env, client: MongoClient): Promise<BetterAuthInstance>`. Dynamically imports the 5 ESM subpaths, builds the betterAuth instance with admin + organization + passkey + twoFactor + phoneNumber + Google social + email-verify/reset, returns the typed instance. `as any` cast at the plugins boundary is acceptable per `auth.factory.ts` precedent (plugin-type intersection is un-expressible).
- `src/auth-service.module.ts` — `@Module({ providers: [AUTH_MONGO_CLIENT_PROVIDER, AUTH_INSTANCE_PROVIDER, AuthGuard, { provide: APP_GUARD, useClass: AuthGuard }], exports: [AUTH_INSTANCE, AUTH_MONGO_CLIENT, AuthGuard] })`. Implements `OnApplicationShutdown` to close the `MongoClient`.
- `src/auth.guard.ts` — `@Injectable() class AuthGuard implements CanActivate { ... }`. Uses Reflector for ALLOW_ANONYMOUS_KEY; calls `auth.api.getSession({ headers: nodeHeadersToFetchHeaders(req.headers) })`; sets `request.session` + `request.user`; throws `UnauthorizedException({ message: 'Not authenticated', code: 'AUTH_INVALID_TOKEN' })` on no session. Inline `nodeHeadersToFetchHeaders()` helper avoids the ESM-only `better-auth/node` import in this CJS file.
- `src/msg91.ts` — `sendMsg91Otp(env, phone, otp)` helper. Build URL with `authkey`/`mobile`/`otp`/`sender`/`message`; POST to MSG91 send-OTP endpoint; throw on non-2xx. Dev-default behaviour: log warn + return when MSG91_AUTH_KEY is unset.
- `src/index.ts` — extend the barrel with `AuthServiceModule`, `AuthGuard`, `buildBetterAuthInstance`, `sendMsg91Otp`.
- `package.json` — add `better-auth ^1.6.x`, `@better-auth/passkey ^1.6.x`, `mongodb ^6.x`, `@nestjs/core ^11`, `express ^4` (Request type). Keep `"type"` unset (CJS default — dynamic import works under `module: Node16`).

### `apps/api-gateway/`

- `src/main.ts` — after `app.use(cookieParser())` + Helmet, BEFORE `app.use(express.json())`, get the auth instance via `app.get(AUTH_INSTANCE)`, dynamically import `better-auth/node` for `toNodeHandler`, then mount `expressApp.all('/api/auth/{*any}', toNodeHandler(auth))`.
- `src/app.module.ts` — replace the local `AuthModule` import with `AuthServiceModule` from `@lotusgift/auth-service`. Add `{ provide: ENV_TOKEN_NAME, useValue: env }` provider so AuthServiceModule's async factories can inject the typed Env.
- `src/auth/` — DELETE `auth.controller.ts` (the stub) + `auth.module.ts` (we mount via Express directly now).
- `package.json` — add `@lotusgift/auth-service: workspace:*` dependency.
- `Dockerfile` — add `services/auth-service/package.json` COPY in deps stage + full `services/auth-service` directory COPY in build stage (same pattern as PR-13 + PR-14 for the workspace package additions).

### `packages/config/`

- `src/env.schema.ts` — add `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`, `MSG91_SENDER_ID`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` as optional strings. No `superRefine` prod-gating — production launch happens with or without each based on which auth methods we light up.

### `.env.example`

- Append the 5 new entries (names only, no values), grouped under `# ---- MSG91 (P5b phone OTP) ----` + `# ---- Google OAuth (P5b social provider) ----` comment headers.

### Tests

- `services/auth-service/src/auth.guard.spec.ts` — covers: allow when handler is `@AllowAnonymous`; throw 401 when no session; pass + populate `request.session` + `request.user` when session present.
- `services/auth-service/src/auth-service.module.spec.ts` — module compiles when the dynamic-import factory is stubbed; `AUTH_INSTANCE` token resolves; `OnApplicationShutdown` invokes `client.close()`.
- `services/auth-service/src/msg91.spec.ts` — `sendMsg91Otp` POSTs to the expected URL when keys are set; logs + returns when MSG91_AUTH_KEY is unset.

### Research note

- `docs/research/phase-5b-auth-runtime.md` — citations table (≥10 entries, retrieval-dated 2026-05-15), decisions log (≥10), open questions (≥3), implementation checklist, versions captured.

### GitHub

- Phase 5b Epic issue under milestone #6 with `phase/P5,area/infra,epic` labels.
- Phase 5b Phase-Acceptance issue under milestone #6 with `phase/P5,phase-acceptance` labels.

## Acceptance criteria

- `pnpm check-types` — 33-35/33-35 green.
- `pnpm lint` — 36/36 green.
- `pnpm test` — 14-17/14-17 turbo tasks green.
- `pnpm build` — 8/8 green.
- `pnpm dep-cruiser` — 0 errors.
- `pnpm dlx markdownlint-cli2 docs/research/phase-5b-auth-runtime.md .cursor/plans/p5b_auth_service_runtime_pr-15_4920fca6.plan.md` — 0 errors.
- `/api/auth/*` returns Better-Auth's real handler output (not 503 stub).
- All 16 required CI checks green on PR-15.
- Copilot review addressed.
- Admin squash-merged, branch deleted local + remote.
- Parent plan `p5` todo flipped to `status: completed`.
- Phase 5 milestone (#6) closed.

## Open questions parked

- **Q1:** Better-Auth's recent v1.6 OpenTelemetry instrumentation — wire to the @repo/observability bootstrap or leave for P21? **Decision:** leave for P21 (the OTEL hardening phase). Logs the parked decision in the research note.
- **Q2:** MSG91 callback url for verify-OTP responses — Better-Auth's `phoneNumber` plugin verifies internally so we only need send-OTP. Confirmed against the canary docs page 2026-05-15.
- **Q3:** Cross-platform Google client IDs (web + iOS + Android) — `socialProviders.google.clientId` accepts string OR string-array per the v1.6 release notes. We ship single-string for MVP since there are no mobile apps yet (parked to post-launch in `docs/runbooks/scaling-up.md` mobile-apps section).

## Status-sync closing step (post-merge)

1. `git checkout main && git pull && git branch -d pr-15-auth-runtime && git push origin --delete pr-15-auth-runtime`.
2. `gh issue close <epic-num> --reason completed` + `gh issue close <acceptance-num> --reason completed`.
3. `gh api -X PATCH repos/goldr0g3r/lotusgift/milestones/6 -f state=closed`.
4. Update parent plan `p5` todo content (P5 + P5b merged collectively) + `status: completed`.
5. Backfill `docs/research/phase-5-auth-service.md` §6 with PR-15 link + squash SHA + lessons learned.
6. Backfill `docs/research/phase-5b-auth-runtime.md` §6 with PR-15 link + squash SHA.
7. Project board #9: add PR + issues via `gh project item-add`, then `gh project item-edit` for Status=Done / Phase=P5 / Workstream=auth / Layer=L4 / Type=feat.
8. `git push origin main` for the closeout commit.
