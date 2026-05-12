# REST over tRPC, with nestjs-zod and Kubb-generated TanStack Query hooks

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan authors (nursery-plan adaptation)
- **Informed:** all future service authors, all four Next.js app authors

## Context and Problem Statement

LotusGift v2 will expose typed HTTP APIs from `apps/api-gateway` consumed by four Next.js apps (`web-customer`, `web-vendor`, `web-admin`, `web-customer-service`) and, post-launch, by third-party vendor systems via the published OpenAPI spec. We need a single decision on the API style + the codegen pipeline that wires it into the frontends. The parent plan ([§4 and §6](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)) commits to REST + nestjs-zod + Kubb; this ADR ratifies that and forecloses tRPC and bespoke fetch wrappers.

## Decision Drivers

- The published API must be consumable by **non-TypeScript clients** (third-party vendor ERPs, partner integrations) — the published surface must be standard HTTP + JSON, not a TypeScript-only RPC protocol.
- The four Next.js apps must share **end-to-end type safety** (request/response types + runtime validation) without hand-maintaining a parallel type tree.
- Better-Auth integrates as a standard HTTP handler mounted before the framework (see `_old/apps/api/src/main.ts`). It does not have a tRPC adapter; mounting Better-Auth + tRPC in the same Nest app means falling back to REST for auth anyway.
- Backend devs writing endpoints want **OpenAPI/Swagger as a generated artifact**, not a separate manual document.

## Considered Options

- **REST + nestjs-zod (Zod schemas → DTOs → auto-generated OpenAPI) + Kubb (OpenAPI → TanStack Query React hooks in `@repo/api`).** [chosen]
- tRPC (`@trpc/server` + `@trpc/react-query`).
- GraphQL via NestJS code-first.
- Hand-rolled fetch wrappers + manually maintained TypeScript types.

## Decision Outcome

Chosen option: **"REST + nestjs-zod + Kubb"**, because it gives end-to-end type safety from a single source-of-truth (Zod schemas in `@repo/validators`), exposes a standard HTTP surface for non-TS clients (vendor ERPs at P6, partner integrations post-P22), preserves the existing `@thallesp/nestjs-better-auth` mount pattern from `_old/`, and ships TanStack Query hooks for the frontends without any hand-written client code.

Concrete pipeline:

```text
packages/validators (Zod schemas)
  └─> nestjs-zod uses them as DTOs in services/*
       └─> @nestjs/swagger auto-emits OpenAPI 3.1 at /api/openapi.json
            └─> Kubb (CI step) reads the spec
                 └─> emits packages/api/src/hooks/* (TanStack Query useQuery / useMutation)
                      └─> imported by all 4 Next.js apps
```

Key conventions:

- **One source of truth for types:** `@repo/validators` exports Zod schemas; service DTOs, request validators, response serializers, and frontend types all derive from those schemas.
- **Runtime validation on both sides:** server-side via `ZodValidationPipe` (request) + `ZodSerializerInterceptor` (response); client-side validation is implicit via the generated hooks calling typed responses.
- **OpenAPI 3.1 + Swagger UI** exposed at `/api/openapi.json` and `/api/docs` (production-mode-gated via env flag — see ADR-005 for the production posture).
- **Error envelope:** RFC 9457 `application/problem+json` for every error response (parent plan §4 "RFC 9457 error envelope"). Generated Kubb hooks surface `Problem` typed errors to React Query.
- **Codegen runs in CI** (PR-4) — any drift between the committed `@repo/api` hooks and the live OpenAPI spec fails the build via `.github/workflows/openapi-drift.yml`.

### Consequences

- Good, because **Zod is the single contract** — adding a new field updates the schema once and propagates to server DTO, OpenAPI spec, generated hook, and React Query cache type.
- Good, because the published OpenAPI spec lets vendor partners + future mobile clients integrate without depending on our TypeScript toolchain.
- Good, because nestjs-zod's APP_PIPE / APP_INTERCEPTOR pair is documented production-ready (citation #13) and replaces the deprecated `patchNestJsSwagger`.
- Good, because Kubb's `@kubb/plugin-react-query` directly targets TanStack Query v5, which is what we'll use across the Next apps regardless of this decision.
- Bad, because Kubb codegen + OpenAPI parsing adds a build-time step (slower CI vs. tRPC). Mitigation: cache the codegen output keyed on the spec hash.
- Bad, because the OpenAPI surface area must be kept clean (no leaky internal types in public endpoints) — this is a discipline cost.
- Neutral, because REST verbs feel less ergonomic than tRPC's procedure-style API from a JS-only standpoint. Mitigation: TanStack Query hooks are equivalently ergonomic in practice.

### Confirmation

- `.github/workflows/openapi-drift.yml` (PR-4) regenerates `@repo/api` against the live spec and fails the build on diff.
- `packages/validators/__tests__/*.spec.ts` round-trip every public DTO schema through Zod parse + the auto-generated OpenAPI schema (using `zod-to-openapi`) to confirm coverage.
- `apps/api-gateway` integration test fetches `/api/openapi.json`, validates it against the OpenAPI 3.1 meta-schema, and asserts no `additionalProperties: true` on public response shapes.
- Every PR that adds an endpoint must also add a generated hook (or the codegen drift workflow will fail).

## Pros and Cons of the Options

### REST + nestjs-zod + Kubb [chosen]

- Good, because the standard HTTP surface is consumable by any client (TS, Python, curl, Postman, Insomnia).
- Good, because nestjs-zod is actively maintained (v5.3.0, Apr 2026 — citation #13).
- Good, because Kubb v3 targets TanStack Query v5 directly (citation #14).
- Good, because preserves the existing Better-Auth handler mount pattern (no adapter needed).
- Bad, because two artifacts (spec + generated hooks) instead of one shared module.
- Bad, because client-side type narrowing on discriminated unions (e.g., error envelopes) requires extra discriminator fields in the schemas.

### tRPC

- Good, because end-to-end types in a single `Router` module; no codegen step.
- Good, because procedure-style API is ergonomic for solo full-stack devs.
- Bad, because **tied to TypeScript clients** — vendor ERPs and third-party integrations need either a custom REST shim layer or a generated OpenAPI export (`trpc-openapi`), which negates the simplicity advantage.
- Bad, because no clean composition with the existing Better-Auth mount-before-NestJS pattern (Better-Auth is a Web Standard `Request → Response` handler; tRPC's batching link expects its own request format).
- Bad, because tRPC has no equivalent of nestjs-zod's APP_INTERCEPTOR for unified serialization across REST + RPC; we'd lose the RFC 9457 error envelope's HTTP-native shape.

### GraphQL via NestJS code-first

- Good, because typed schema + auto-generated client; mature ecosystem (Apollo, Relay, urql).
- Bad, because the operational surface area (resolvers, dataloaders, persisted queries, field-level auth, N+1 prevention) is far larger than REST for a team of one.
- Bad, because vendor ERP integrations expect REST, not GraphQL — same client-portability issue as tRPC, worse.
- Bad, because no clean Razorpay-webhook story (raw-body capture and HMAC verify is a REST-shape problem).

### Hand-rolled fetch wrappers + manual types

- Good, because zero new tooling.
- Bad, because **manual types drift instantly** — provably so from the `_old` codebase, where the `apps/web/lib/api.ts` types diverged from `apps/api/src/*/*.dto.ts`.
- Bad, because no runtime validation on the client → silent schema drift bugs at the JSON parse boundary.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), sections 4 (`apps/api-gateway`), 6 (Kubb + plugin-react-query).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citations #13 (nestjs-zod 5.3.0), #14 (Kubb v3 + plugin-react-query).
- Research note: [`docs/research/phase-0-scaffold.md`](../research/phase-0-scaffold.md), rows 5 and 6.
- Cursor rule: [`.cursor/rules/api-type-safety.mdc`](../../.cursor/rules/api-type-safety.mdc) — codifies the Zod-first pipeline as a hard rule.
- Skill: [`.cursor/skills/add-rest-endpoint/SKILL.md`](../../.cursor/skills/add-rest-endpoint/SKILL.md) — step-by-step guide for adding a new endpoint under this decision.
- Related ADRs:
  - [ADR-004](0004-modular-monolith-first.md) — the modular monolith hosts the OpenAPI surface.
  - [ADR-007](0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) — corporate-gifting-specific DTOs (RFQ, customization, recipient list) all flow through this same pipeline.
