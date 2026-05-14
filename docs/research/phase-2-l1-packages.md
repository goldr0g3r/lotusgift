# Phase-2 L1 leaf packages research note

**Date:** 2026-05-14
**Phase:** 2
**Workstream:** infra (shared L1 contracts)
**Layer:** L1 (consumed by every L2+ package, every service, every app)
**Sub-plan:** [`.cursor/plans/p2_l1_leaf_packages_pr-10_8329fb87.plan.md`](../../.cursor/plans/p2_l1_leaf_packages_pr-10_8329fb87.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

PR-10 populates the 4 L1 leaf packages (`@repo/types`, `@repo/validators`, `@repo/events`, `@repo/openapi-spec`) with foundation primitives PLUS empty `index.ts` skeleton folders for all 16 future services. Service-specific schemas land per-service in P5+ per `.cursor/rules/api-type-safety.mdc` (`packages/validators/src/<service>/*.ts`) and `.cursor/rules/event-driven-discipline.mdc` (`packages/events/src/<service>/<event-name>.v1.ts`).

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Zod 4 `z.toJSONSchema()` | <https://v4.zod.dev/json-schema> | Native JSON Schema conversion shipped in Zod 4. Accepts `target: 'draft-04' \| 'draft-07' \| 'draft-2020-12' \| 'openapi-3.0'`. For OpenAPI use we pass `target: 'openapi-3.0'`. Throws on un-representable types (`bigint`, `symbol`, `undefined`, `date`, `map`, `set`, `transform`, `nan`, `custom`) unless `unrepresentable: 'any'`. |
| 2 | Zod 4 migration + release notes | <https://zod.dev/v4/changelog> | Error-API unified (`message`, `invalid_type_error`, `required_error` → single `error` parameter). `errorMap` renamed to `error`. ZodError issue type renamed (`ZodInvalidTypeIssue` → `$ZodIssueInvalidType`). |
| 3 | nestjs-zod v5 release notes | <https://github.com/BenLorantfy/nestjs-zod/releases/tag/v5.0.0> | `patchNestJsSwagger` → `cleanupOpenApiDoc(doc)` before `SwaggerModule.setup`. `zodToOpenAPI` → `zodV3ToOpenAPI` (Zod v4 has built-in). `getZodError` returns `unknown` (BYO Zod version). Forward reference only — nestjs-zod stays at L4 in `apps/api-gateway`; P2 doesn't pull it into L1. |
| 4 | RFC 9457 Problem Details for HTTP APIs | <https://datatracker.ietf.org/doc/rfc9457/> | IETF July 2023; supersedes RFC 7807. 5 core members (`type`, `title`, `status`, `detail`, `instance`) + arbitrary extension members. Media type `application/problem+json`. We add `code` (machine-readable LotusGift error-code) + `traceId` (correlation id) + `errors[]` (field-level validation issues) as extension members. |
| 5 | OpenAPI 3.1 specification extensions | <https://spec.openapis.org/oas/v3.1.0#specification-extensions> | `x-*` keys allowed at any object position; ignored by core tooling but consumed by code-generators. We pre-define 5 extension keys consumed by Kubb + our own runtime. |
| 6 | Kubb v3 `@kubb/plugin-react-query` | <https://kubb.dev/plugins/plugin-react-query/> | Kubb 3.x emits TanStack Query v5 hooks. Plugin renamed from `@kubb/plugin-tanstack-query` in v3. Reads OpenAPI `operationId` for hook names and standard `x-*` extensions for hook hints (`infinite`, `suspense`). Forward reference — wired into CI at P4. |
| 7 | GSTIN format (CBIC + GSTN portal) | <https://lookuptax.com/docs/country/india-gst-guidelines-indirect-tax-sales-tax-india> | 15-char: 2-digit state code + 10-char PAN + entity-serial digit (1-9 or A-Z) + literal `Z` + checksum (alphanumeric). Regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` matches format only; mod-36 checksum verification is a separate `gstin-validator` runtime check deferred to P6 (vendor-service KYC). |
| 8 | India postal PIN | <https://en.wikipedia.org/wiki/Postal_Index_Number> | 6-digit; first digit 1-9 (never 0). Regex `^[1-9]\d{5}$`. |
| 9 | E.164 phone-number format | <https://www.itu.int/rec/T-REC-E.164> | India MSISDN: `+91` country code + 10-digit mobile starting `6-9`. Regex `^\+91[6-9]\d{9}$`. |
| 10 | ULID spec | <https://github.com/ulid/spec> | 26-char canonical encoding (10-char timestamp + 16-char random). Crockford base32 alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (no I, L, O, U). Case-insensitive, URL-safe. Regex `^[0-9A-HJKMNP-TV-Z]{26}$`. |
| 11 | Outbox pattern (Chris Richardson) | <https://microservices.io/patterns/data/transactional-outbox.html> | Domain row + outbox row written in same Mongo transaction; relayer publishes asynchronously with at-least-once delivery + idempotency-key dedup downstream. Backs `OutboxRowSchema` in `@repo/events`. |
| 12 | MADR v3.0 (decision-log template) | <https://adr.github.io/madr/> | Format reference for Section 2 below + future per-service ADRs. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Zod major version | Zod 4 (`^4.4.3`) | Zod 3 (broader ecosystem) | Lockfile already resolves Zod 4.4.3 via a transitive (Metro's `hermes-parser`). Per `.cursor/rules/always-latest-docs.mdc` adopt the latest. Zod 4 ships built-in `z.toJSONSchema()` which eliminates the `zod-to-json-schema` dependency. |
| D2 | nestjs-zod placement | NOT in L1 — re-imported at L4 (`apps/api-gateway` controllers) | Re-export `createZodDto` from `@repo/validators` | `nestjs-zod` transitively pulls NestJS (L4+); per `.cursor/rules/architecture-layers.mdc` L1 imports only from L0. Keeps L1 framework-free + swap-out-able. |
| D3 | RFC 9457 library | Defer to P4 | Ship `@camcima/nestjs-rfc9457` now | The library decision belongs to the api-gateway shell (P4). P2 ships the wire-format schema only (`ProblemDetailsSchema` + JSON Schema) so consumers can encode/decode regardless of framework. |
| D4 | INR representation | Paise (integer, `100 paise = ₹1`) | Rupees (decimal) | Avoids floating-point math; matches Razorpay's wire format (`amount` in paise). Schema: `InrPaiseSchema = z.number().int().nonnegative()`. Branded type: `InrPaise = Brand<number, 'InrPaise'>`. |
| D5 | Multi-currency | INR-only MVP | Generic `Money { amount, currency }` | Single-currency MVP for India launch; multi-currency parked to `docs/runbooks/scaling-up.md`. Avoids over-engineering. |
| D6 | `__schemaVersion` format | `MAJOR.MINOR` strings (e.g. `'1.0'`, `'1.1'`, `'2.0'`) | Full semver (e.g. `'1.0.0'`) | Per `.cursor/rules/event-driven-discipline.mdc` exemplar. Patch versions add noise for event schemas (cosmetic-only changes don't justify a version bump; breaking goes major; additive goes minor). |
| D7 | ID type | ULID (Crockford base32, 26-char) | UUID v4 / Mongo ObjectId | Lexicographically sortable (timestamp prefix) + URL-safe + shorter than UUID + 128-bit compatible. `OrderStatus.ts` enums and entity references all use `UlidString`. Mongo `_id` stays an ObjectId at the DB layer but the domain identifier exposed to APIs/events is the ULID `id` field. |
| D8 | Per-service schema layout | Subpath imports (`@repo/validators/order`) | Flat barrel (`@repo/validators`) | Matches `.cursor/rules/api-type-safety.mdc` `packages/validators/src/<service>/*.ts` layout. Keeps service-private schemas truly private (apps and other services subpath-import only what they need). P2 ships empty `<service>/index.ts` shells for all 16. |
| D9 | Schema breadth | foundation + 16-service skeletons | foundation-only | User decision (`foundation_plus_all`). The empty `<service>/index.ts` shells reduce friction in P5+ — service PRs add files to an existing folder rather than creating it. |
| D10 | Test coverage thresholds | Opt-in at 80 % per package (un-comment block in each `jest.config.ts`) | Wait until 90 % is achievable | These 4 packages ARE shared contracts; per `.cursor/rules/test-coverage.mdc` leaf tier = 80 %. We ship 5 test files covering the high-risk paths (scalars, error envelope, event envelope, builders, JSON Schema). 80 % achievable from day 1 because scope is bounded. |
| D11 | GSTIN runtime validation depth | Regex-only at L1 | Mod-36 checksum + GSTN portal lookup at L1 | Checksum requires the `gstin-validator` npm package (L1 dep bloat). Per-vendor KYC checksum validation lands in P6 (`services/vendor-service`). Regex catches format errors; checksum catches typos at submission. |
| D12 | ProblemDetails JSON Schema generation | Zod 4 native `z.toJSONSchema()` with `target: 'openapi-3.0'` | `zod-to-json-schema` npm package | Zod 4 ships it built-in (decision D1 cascade); avoids the extra dep + version drift risk. Output is OpenAPI 3.0-compatible (good enough for Swagger UI + Kubb). |

## 3. Open questions (parked for follow-up)

- **Q1**: Error-code catalog ownership. Each service phase (P5+) likely adds 2-5 new codes. Process: open a `chore(error-codes): add foo_bar` PR touching `@repo/openapi-spec/src/error-codes.ts` first, OR include the addition in the service PR itself? Recommend the latter (atomic — service ships its codes alongside its endpoints). Parked for first conflict.
- **Q2**: `BaseEventEnvelopeSchema.actor` field optional or required? Optional in P2 (system-emitted events don't have an actor; user-driven ones do). Audit-trail completeness re-visited in P21 (observability hardening).
- **Q3**: `OutboxRowSchema.payload` shape — keep as `z.unknown()` at L1 (each event has its own payload schema) OR force `z.record(z.string(), z.unknown())`? Recommend `z.unknown()` — payload validation happens at the publish callsite via the event-specific schema, not at the outbox layer.

## 4. Implementation checklist

- [x] `docs/research/phase-2-l1-packages.md` (this file) sections 1-5 complete
- [ ] Phase 2 Epic + Phase-Acceptance issues opened under milestone "Phase 2 - L1 Packages"
- [ ] `@repo/types` populated — brand helpers + 10 scalar brands + 9 enums + pagination + audit + README
- [ ] `@repo/validators` populated — Zod 4 schemas paired with `@repo/types` brands + 16-service skeleton + ProblemDetails + README
- [ ] `@repo/events` populated — envelope + version helpers + outbox row + `defineEvent` builder + 16-service skeleton + README
- [ ] `@repo/openapi-spec` populated — x-* extension catalog + ProblemDetails JSON Schema (Zod 4 native) + LotusGift error-code catalog + README
- [ ] `.dependency-cruiser.cjs` L1 boundary rule added
- [ ] 5 test files added; `pnpm test` 5/5 → 9/9 green
- [ ] Full local smoke: install + check-types + lint + test + build + dep-cruiser + markdownlint all green
- [ ] PR opened, Copilot review iterated, squash merged
- [ ] Status sync: project board + Phase 2 Epic + Phase-Acceptance + parent plan + this note Section 6 + Phase 2 milestone closed

## 5. Versions captured

Captured via `pnpm ls --depth=0 -r --filter './packages/{types,validators,events,openapi-spec}'` on the smoke checkout that produced this PR:

| Package | Specifier | Resolved | Notes |
| --- | --- | --- | --- |
| `zod` | `^4.4.3` (new direct dep on `@repo/validators` + `@repo/events`) | 4.4.3 | Lockfile already resolves 4.4.3 via Metro's `hermes-parser` transitive; promoting to direct. |
| `@repo/types` | `workspace:*` | link:packages/types | Used by `@repo/validators` + `@repo/events`. |
| `@repo/validators` | `workspace:*` | link:packages/validators | Used by `@repo/events` + `@repo/openapi-spec`. |
| `ajv` | `^8.x` (devDep on `@repo/openapi-spec` for the JSON Schema validity test) | latest 8.x | Tests only — not a runtime dep. |
| `typescript` | `5.9.2` (per package devDep) | 5.9.2 | Matches PR-9 baseline. |

Refreshed after merge via the same `pnpm ls --depth=0 -r --filter` invocation.

## 6. Implementation reference

Filled after merge: PR URL + squash SHA + diff stats + iteration timeline.
