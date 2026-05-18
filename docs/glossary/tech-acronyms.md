# Tech acronyms

**Audience**: every contributor + coding agents
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Technical acronyms and library names used in the LotusGift v2 codebase.

---

## Atlas Search

MongoDB's built-in full-text + faceted search engine on Atlas clusters. LotusGift M0 tier allows 3 indexes (allocated to: products, vendors, orders). See [`ADR-0006`](../adr/0006-atlas-search-m0-budget-3-indexes.md).

## Better-Auth

TypeScript-first authentication framework. Provides email/password, passkey (WebAuthn), TOTP 2FA, session management, and the Organization plugin for multi-tenant corporate accounts. Backend: `services/auth-service`. Client: `packages/auth-client`.

## createZodDto

A function from `nestjs-zod` that converts a Zod schema into a NestJS DTO class with automatic validation and OpenAPI metadata generation. The bridge between `packages/validators` (Zod) and NestJS controller `@Body()` params.

## dep-cruiser (dependency-cruiser)

Static analysis tool that enforces the L0→L6 architecture layer import rules. Runs in CI to prevent downward imports. Config: `.dependency-cruiser.cjs`.

## Kubb

Code generation tool that reads an OpenAPI 3.1 spec and generates TypeScript hooks (`@kubb/plugin-react-query`). Output: `packages/api/` — consumed by all `apps/web-*` frontends.

## nestjs-zod

NestJS integration for Zod schemas. Provides `createZodDto`, `ZodValidationPipe`, and OpenAPI metadata extraction. Replaces `class-validator` + `class-transformer`.

## OTEL (OpenTelemetry)

Vendor-neutral observability framework for traces, metrics, and logs. LotusGift uses the Node.js SDK to emit spans to Grafana Cloud (traces + metrics) and Sentry (errors).

## OutboxPort

The transactional outbox interface in `packages/utils`. Services publish events through `OutboxPort.publish(event, { transactionId })`. Implementation swappable: `InProcessOutbox` (EventEmitter, MVP) → Upstash Workflow + QStash (post-revenue).

## R2 (Cloudflare R2)

Cloudflare's S3-compatible object storage with zero egress fees. Used for: product images, art uploads, KYC documents, recipient-list CSVs.

## RFC 9457

"Problem Details for HTTP APIs" — the standard error response format. All API errors return `{ type, title, status, detail, instance }` per this RFC.

## SSE (Server-Sent Events)

One-way streaming from server to client. Used for real-time notifications (order status updates, customization approval events) without WebSocket complexity.

## TTL (Time To Live)

Expiration time on cache/reservation entries. Stock reservations in Redis use TTL to auto-release held inventory when cart is abandoned. Also used for session expiry.

## Turborepo

Monorepo build orchestrator. Caches task outputs, parallelizes builds, respects the dependency graph defined in `turbo.json`. Commands: `pnpm build`, `pnpm dev`, `pnpm lint`, etc.

## Zod

TypeScript-first schema declaration and validation library. The single source of truth for all data shapes in LotusGift: API DTOs, env vars, event payloads, form validation.
