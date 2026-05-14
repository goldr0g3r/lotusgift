# Phase-4 api-gateway shell research note

**Date:** 2026-05-14
**Phase:** 4
**Workstream:** infra (gateway shell)
**Layer:** L5 (apps/api-gateway)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) `p4` todo

PR-13 transforms `apps/api-gateway/src/{main,app.module}.ts` from the create-nest-app placeholder into the production-grade modular-monolith shell: ConfigModule + MongooseModule + OutboxModule + Pino + RFC 9457 exception filter + Swagger spec + Better-Auth mount-point scaffold. Actual auth-service implementation lands at P5; this PR ships the shell with stubs that boot cleanly.

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | NestJS 11 + Better-Auth (`@thallesp/nestjs-better-auth`) | <https://github.com/thallesp/nestjs-better-auth> | `BetterAuthModule.forRootAsync({ useFactory })` returns a Nest module wrapping a Better-Auth instance. `AuthGuard` from the package + `@AllowAnonymous()` decorator pattern. The package's `toNodeHandler` must be mounted BEFORE Nest's body parser. |
| 2 | NestJS 11 `bodyParser: false` | <https://docs.nestjs.com/faq/raw-body> | `NestFactory.create(AppModule, { bodyParser: false, rawBody: true })` lets the bootstrap explicitly mount each parser middleware later — required to keep Razorpay webhook bytes intact for HMAC verification. |
| 3 | `nestjs-zod` v5.x | <https://github.com/BenLorantfy/nestjs-zod> | `ZodValidationPipe` (global), `ZodSerializerInterceptor` (global), `createZodDto(schema)` (per controller). `cleanupOpenApiDoc(doc)` replaces the deprecated `patchNestJsSwagger` for Swagger integration. |
| 4 | `@nestjs/swagger` 11.x | <https://docs.nestjs.com/openapi/introduction> | `DocumentBuilder + SwaggerModule.createDocument(app, config)` + `SwaggerModule.setup('docs', app, document)`. Pair with `cleanupOpenApiDoc` for Zod DTOs (source #3). |
| 5 | helmet v8 + NestJS | <https://docs.nestjs.com/security/helmet> | `app.use(helmet())` mounts CSP + HSTS + frame-deny etc. CSP relaxed for `/api/docs` (Swagger UI ships inline scripts). |
| 6 | `@upstash/ratelimit` + `@upstash/redis` | <https://upstash.com/docs/redis/sdks/ratelimit-ts/gettingstarted> | `Ratelimit.slidingWindow(60, '60 s')` returns a `RateLimit` instance. Pair with the Redis REST client (`Redis.fromEnv()`). Free tier: 10k commands/day. |
| 7 | RFC 9457 ProblemDetails (re-cited from P2) | <https://datatracker.ietf.org/doc/rfc9457/> | Wire format `application/problem+json` with the LotusGift extension fields landed in `@repo/openapi-spec/problem-details`. |
| 8 | Kubb v3 `@kubb/cli` + `@kubb/plugin-react-query` | <https://kubb.dev/getting-started/configure> | `kubb.config.ts` defines input (OpenAPI JSON path) + plugins. CLI: `kubb generate --config kubb.config.ts`. Re-emits `@repo/api/src/<service>/use*.ts` TanStack Query hooks. |
| 9 | NestJS 11 OnApplicationShutdown | <https://docs.nestjs.com/fundamentals/lifecycle-events> | Hook used by the OutboxPort provider to await `port.stop()` (drains in-flight ticks) + the OTEL SDK to await `shutdownOtel(sdk)`. |
| 10 | nestjs-pino integration | <https://github.com/iamolegga/nestjs-pino> | `LoggerModule.forRoot({ pinoHttp: ... })`. Wraps the `createLogger` factory from `@repo/utils` so per-request logs auto-inject the trace-id mixin. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Better-Auth instance source | Stub `BetterAuthMountController` that 404s every `/api/auth/*` request in P4; real instance + handler wired at P5 (`services/auth-service`) | Ship a working Better-Auth instance now | Real auth needs the schema + providers + email + DB adapters — all P5 surface. P4 ships only the mount-point + middleware order so the gateway boots cleanly. |
| D2 | Rate-limit middleware | Provider scaffold + DI token (`RATE_LIMIT`); actual `@upstash/ratelimit` wiring stays off until `UPSTASH_REDIS_REST_URL` is set at runtime (production-only env var) | Always-on rate limit | Free-tier Upstash quota: 10k commands/day. CI + dev don't need rate-limiting; production toggles via env var. |
| D3 | RFC 9457 filter library | Hand-rolled `GlobalProblemDetailsFilter` using `@repo/openapi-spec` + `@repo/validators` | `@camcima/nestjs-rfc9457` library | Library brings its own decorators that conflict with the schema-derived `@repo/openapi-spec/ProblemDetailsJsonSchema` we already ship at L1. Hand-rolling is 80 lines + integrates directly with our error-code catalog + `currentTraceId()`. |
| D4 | Pino integration | `nestjs-pino` `LoggerModule.forRoot({ pinoHttp })` so every request line is auto-logged | Manual interceptor | `nestjs-pino` is the canonical Nest wrapper; ~3kB overhead; integrates with `app.useLogger()` so Nest's own logs flow through pino. |
| D5 | Swagger UI path | `/api/docs` (UI) + `/api/docs-json` (JSON for Kubb consumption) | Top-level `/docs` | Matches `app.setGlobalPrefix('api')` convention; `/api/docs-json` is a stable URL Kubb config points at. |
| D6 | CSP for `/api/docs` | Allow `unsafe-inline` for scripts + styles ONLY on the `/api/docs*` paths via a route-specific helmet middleware | Disable CSP globally | Swagger UI needs inline scripts; relaxing CSP globally would defeat its purpose elsewhere. Route-specific middleware keeps the rest of the gateway under strict CSP. |
| D7 | Raw-body capture | Reserved for `/api/payments/webhook` only (P10) — at P4 the gateway just enables `rawBody: true` on NestFactory and provides the `RawBodyGuard` helper exported from `@repo/utils` | Globally capture raw body | Capturing raw body for every request doubles memory pressure. Razorpay webhook is the only consumer; opt-in per controller. |
| D8 | OutboxPort lifecycle | `OUTBOX_PORT` provider with `OnApplicationBootstrap` (calls `port.start()`) + `OnApplicationShutdown` (awaits `port.stop()`) | Manual `.start()` in `main.ts` | Lifecycle hooks are the canonical Nest way + survive `app.close()` correctly during hot reload + tests. |
| D9 | Kubb codegen wiring | `pnpm api:generate` script in root + `kubb.config.ts` + a CI job that re-runs codegen and diffs the output (fails PR if drift) | Generate at runtime | Codegen at install/CI time keeps the consumer apps' bundles deterministic; runtime codegen would slow `pnpm dev` + add a build-step dependency. |
| D10 | `apps/api-gateway/package.json` `type` field | NO `"type": "module"` (CJS — matches existing PR-7 + PR-9 state) | Switch to ESM | `@thallesp/nestjs-better-auth` ships dual CJS+ESM but Nest's runtime still prefers CJS for decorator emit. P21 may revisit. |
| D11 | `cleanupOpenApiDoc` placement | Just before `SwaggerModule.setup(...)` in `main.ts`; transforms the doc so Zod DTOs render correctly | Skip (use deprecated `patchNestJsSwagger`) | Per source #3, `patchNestJsSwagger` is deprecated in nestjs-zod v5. `cleanupOpenApiDoc` is the replacement. |
| D12 | Health endpoints | Existing `/healthz` (liveness, no probes) + new `/readyz` (probes Mongo via `mongoose.connection.readyState === 1`) | Single `/health` | Industry-standard split (k8s probes + Docker `HEALTHCHECK` use `/healthz`; LB / readiness gates use `/readyz`). |

## 3. Open questions (parked for follow-up)

- **Q1:** Better-Auth instance at P5 — decide on the Mongo adapter version + email provider concretes. Out of P4 scope.
- **Q2:** Rate-limit policy table by x-rate-limit-tier extension — lands at P5 alongside real auth (each tier needs identity to bucket against).
- **Q3:** Kubb React Query 5 vs Suspense Query — defer to P16 (web-customer) where consumer ergonomics drive the choice.

## 4. Implementation checklist

- [x] research note (this file)
- [ ] Phase 4 Epic + Phase-Acceptance issues
- [ ] `apps/api-gateway/src/main.ts` — production bootstrap (bodyParser:false, OTEL, Helmet, CORS, Swagger, toNodeHandler scaffold)
- [ ] `apps/api-gateway/src/app.module.ts` — ConfigModule (loadEnv), MongooseModule, nestjs-pino, ZodValidationPipe + ZodSerializerInterceptor globals, GlobalProblemDetailsFilter, TraceIdMiddleware, OutboxPort provider with lifecycle hooks
- [ ] `apps/api-gateway/src/auth/` — Better-Auth mount-point stub (404s until P5)
- [ ] `apps/api-gateway/src/common/problem-details.filter.ts` — RFC 9457 global filter
- [ ] `apps/api-gateway/src/common/trace-id.middleware.ts`
- [ ] `apps/api-gateway/src/common/outbox.provider.ts`
- [ ] `apps/api-gateway/src/health/health.controller.ts` — add `/readyz`
- [ ] `kubb.config.ts` (root) + `pnpm api:generate` script
- [ ] Tests: gateway smoke (healthz + readyz + problem-details filter + tracing)
- [ ] Local smoke + CI green
- [ ] PR-13 squash-merged + status sync

## 5. Versions captured

| Package | Specifier | Notes |
| --- | --- | --- |
| `@nestjs/swagger` | `^11.x` | OpenAPI 3.1 + Zod via nestjs-zod's `cleanupOpenApiDoc` |
| `nestjs-zod` | `^5.x` | `ZodValidationPipe` + `ZodSerializerInterceptor` + `createZodDto` |
| `nestjs-pino` | `^4.x` | Wraps `createLogger` from `@repo/utils` |
| `helmet` | `^8.x` | Mounted globally; CSP relaxed on `/api/docs*` |
| `@upstash/ratelimit` | `^2.x` | Provider scaffold; gated by `UPSTASH_REDIS_REST_URL` env var |
| `@upstash/redis` | `^1.x` | REST client paired with ratelimit |
| `@thallesp/nestjs-better-auth` | `^2.x` | Mount-point scaffold; real instance at P5 |
| `@kubb/cli` + `@kubb/plugin-react-query` + `@kubb/plugin-oas` | `^3.x` | OpenAPI → TanStack Query hooks |
| `cookie-parser` | `^1.x` | Better-Auth cookie domain handling |

## 6. Implementation reference

- **PR:** [#29 — feat(gateway): polish api-gateway shell + RFC 9457 filter + OutboxPort lifecycle + Swagger + kubb scaffold](https://github.com/goldr0g3r/lotusgift/pull/29)
- **Squash SHA on `main`:** `b8e8b2ce2005a9ebafe62499a34fcd89b10a544d` (merged 2026-05-14)
- **Branch lifetime:** `pr-13-api-gateway` (created + deleted 2026-05-14)
- **Commits squashed (2):** initial polish + Dockerfile fix (added 8 missing workspace `package.json` COPY entries for the new @repo/config, @repo/database, @repo/events, @repo/observability, @repo/openapi-spec, @repo/types, @repo/utils, @repo/validators deps).
- **Issues closed:** [#27 (Phase 4 Epic)](https://github.com/goldr0g3r/lotusgift/issues/27), [#28 (Phase 4 Phase-Acceptance)](https://github.com/goldr0g3r/lotusgift/issues/28). Phase 4 milestone (#5) closed.
- **CI status:** all 16 required checks green on the final commit.
- **Test counts:** 6 new tests across 4 api-gateway suites (problem-details filter 5 + trace-id middleware 4 + health-controller readiness 2 new). Pre-existing app + links specs preserved.
- **Lessons learned:**
  1. The Dockerfile's per-package COPY list must be expanded whenever a new workspace package is added — pnpm's workspace resolver fails on missing `package.json` files even if the actual source isn't needed (because it builds the workspace graph first).
  2. `tsconfig.build.json` for the api-gateway must exclude `**/*.test.ts` so `nest build` (which uses tsc) doesn't compile test files + fail on the jest globals.
  3. `getConnectionToken()` from `@nestjs/mongoose` is the correct DI token for the default Mongoose connection in `useFactory.inject: [...]` — `InjectConnection()` is a parameter decorator, not a token, and fails at module compile.
