---
name: LotusGift v2 architecture rebuild
overview: Near-full rebuild of LotusGift adopting the nursery-plan architecture (modular-monolith NestJS + 4 Next.js apps + multi-vendor + multi-warehouse + observability + Atlas Search + OutboxPort), adapted for corporate gifting (RFQ auto-router, deep customization workflow, recipient-list drop-shipping). Visual design language is preserved 1:1 via a new `@repo/design-tokens` package, re-implemented on Radix Primitives + CSS Modules + Sass.
todos:
  - id: p0-scaffold
    content: "PR-1 chore(scaffold): move all top-level files/dirs (except .git / .cursor / .github) into _old/ via git mv preserving history. Re-scaffold via pnpm dlx create-turbo@latest --example with-nestjs --package-manager pnpm (in sibling temp dir, then move contents in since .git blocks in-place). Rename apps/web → apps/web-customer. Add 3 Next.js apps via pnpm dlx create-next-app@latest apps/web-vendor / apps/web-admin / apps/web-customer-service (all --app --typescript --src-dir --import-alias '@/*' --no-tailwind --use-pnpm). Generate 16 empty Nest libraries via nest g library <name> for auth-service through support-service. Generate empty packages via pnpm dlx tsx scripts/scaffold-package.ts. CLI captures latest stable versions automatically. NO hand-rolled package.json / tsconfig — CLI only. COMPLETED 2026-05-12 via PR #1 (squash 7d50829). nest g library replaced by service-kind scaffolding in scripts/scaffold-package.ts to avoid destructive api-gateway src restructure. Build 7/7, lint 36/36, smoke api-gateway:3001 + web-customer:3000 both 200 OK."
    status: completed
  - id: p0-rules
    content: 'PR-2 chore(rules): commit all .cursor/rules/*.mdc (api-type-safety with nestjs-zod + Swagger + Kubb, deployment-mode modular-monolith-first + transport-agnostic Outbox, research-note-per-module, design-discovery, analytics-instrumentation, always-latest-docs ≤14d, free-tier-budget, architecture-layers, microservice-boundaries, event-driven-discipline, test-coverage) + LotusGift-specific corporate-gifting-domain.mdc (auto-routing thresholds, recipient-list validation, customization workflow invariants) + no-composer-2.mdc (user preference). Mirror in .github/instructions/. Create skill add-rest-endpoint. COMPLETED 2026-05-12 via direct-to-main commits 55e0610 + dacbbbb (bypassed PR workflow; retroactively tracked in Phase-0 Epic issue #4). 15 rules + 5 agents + 1 skill + 15 instructions mirrors + copilot-instructions.md + AGENTS.md + CLAUDE.md verified against p0-rules sub-plan spec (no deviations).'
    status: completed
  - id: p0-docs
    content: 'PR-3 docs(architecture): README rewrite + docs/architecture/dep-graph.svg + ADR-001..ADR-007 (India launch + Razorpay + carrier aggregator; NestJS REST not tRPC; vendor tiered monetization no Customer Prime; modular-monolith-first; Oracle Mumbai + Vercel; Atlas Search M0 budget; corporate-gifting deltas RFQ+customization+recipient-list). COMPLETED 2026-05-13 via PR #7 squash 06b16a90. 15 files / 1272 additions. Adds docs/adr/0001-0007 (MADR v3.0 format), docs/architecture/dep-graph + index README, README rewrite linking the ADRs + dep-graph image. Tracked under Phase-0 Epic #4.'
    status: completed
  - id: p0-ci
    content: 'PR-4 ci: .github/workflows (ci.yml + pr-title.yml + secret-scan.yml + dependency-review.yml + dep-cruiser.yml + openapi-drift.yml skeleton + atlas-search-mapping-drift.yml skeleton + corporate-gifting-domain.yml + free-tier-burn.yml weekly cron + release.yml) + issue templates + PR template + CODEOWNERS + branch-protection JSON. deploy-oracle.yml ships in PR-7; deploy-vercel.yml added at P16. COMPLETED 2026-05-13 via PR #8 squash 3c4fa3a1. 30 files / 2595 additions (incl. merge resolution 21ae1dd for .markdownlint.jsonc + README.md after PR-3/PR-5 landed first). Renovate + markdownlint + actionlint configs included. Branch protection JSON in infrastructure/github/ ready to apply via gh api. Addressed Copilot 8 nits via 17686ee. Tracked under Phase-0 Epic #4.'
    status: completed
  - id: p0-dev-stack
    content: 'PR-5 feat(infra): infrastructure/docker/docker-compose.yml for local dev (Mongo + Redis + Mailpit + OTEL collector). COMPLETED 2026-05-13 via PR #9 squash be1e8d13. 5 files / 449 additions. Mailpit chosen over Mailhog (newer maintained successor). Addressed Copilot review 4 nits via 336c4c4. Tracked under Phase-0 Epic #4.'
    status: completed
  - id: p0-design
    content: "PR-6 docs(design)+feat(design-tokens)+feat(ui): docs/design/DESIGN.md (LotusGift palette + voice + 6-section design-system source-of-truth) + @repo/design-tokens (Style Dictionary v5 emits tokens.scss + tokens.css + typed tokens.ts from 7 token JSONs sourced verbatim from _old/apps/web/tailwind.config.ts brand.green/pink/ink x 10 steps + Plus Jakarta + Geist + radius incl. 4xl/5xl/blob + 7 shadows incl. glow/glow-pink + 13 animation keyframes; 4 Sass mixin files btn/type/util/keyframes consumed by @repo/ui). @repo/ui baseline on Radix Primitives + Sonner + lucide-react + CSS Modules + Sass: Button (primary|pink|outline; sm|md|lg; asChild via @radix-ui/react-slot) + IconButton (dark|light; badge+tone) + Card (header/footer slots; sm|md|lg padding) + Pill (green|pink|ink|neutral) + SectionShell (responsive container) + Toaster (Sonner re-export with LotusGift CSS-var theme). 30 vitest-axe per-component a11y assertions + Playwright + @axe-core/playwright smoke spec mounting all 6 components on one page asserts zero WCAG 2A/2AA/2.1AA/2.2AA violations. New 'a11y' CI job (1m4s on ubuntu-latest) wired as required check on main. Pink Button + IconButton badge use pink-600 (~5.4:1) instead of pink-500 (~4.12:1) to clear AA. COMPLETED 2026-05-13 via PR #12 squash da04f1c4. 80 files / +4606 / -150 lines (68 PR files + 9 Copilot-review fixup files + 3 a11y/pink-600 files). Addressed Copilot's 7 review comments + WCAG color-contrast failure across two follow-up commits. Tracked under Phase-0 Epic #4."
    status: completed
  - id: p0-oracle-runbook
    content: "PR-7 feat(infra): apps/api-gateway/Dockerfile (multi-stage on node:22-alpine, non-root nestjs user, dumb-init PID 1, HEALTHCHECK on new GET /healthz endpoint, multi-arch linux/amd64+arm64 manifest) + infrastructure/oracle/ ready-to-fire tree (compose/docker-compose.prod.yml; nginx/{nginx.conf 1.27 HTTP/2 + TLS 1.3 + Mozilla Intermediate + HSTS preload, sites-available/api.lotusgift.com.conf with ${LOTUSGIFT_API_HOST} placeholder, 6 snippets ssl+security-headers+proxy-params+letsencrypt-acme+connection-upgrade-map}; scripts/{deploy.sh healthcheck-gated zero-downtime swap, rollback.sh, healthcheck.sh, heartbeat.sh with trap-guarded yes burst, certbot-bootstrap.sh}; security/{ufw-rules.sh default deny + 22/80/443, sshd_config.snippet no-root + key-only, logrotate.d/lotusgift-heartbeat}; fail2ban/{jail.local sshd + nginx-limit-req + nginx-badbots + nginx-noscript, filter.d/nginx-limit-req.conf full date+time prefix}; systemd/{lotusgift-api.service consumes pinned tag from .image-tag.env so systemctl restart can't bypass deploy.sh, lotusgift-heartbeat.{service,timer} with OnCalendar=*-*-* 00/6:00:00 RandomizedDelaySec=10m Persistent=true}; .env.production.example with # provenance: P<N> comments; README with tree + apply-order + 14 audit-drift diffs) + .github/workflows/deploy-oracle.yml (3 jobs: build-push docker/setup-qemu-action@v3 + buildx + login@v3 + build-push-action@v6 multi-arch GHA-cached, runs on push:main + push:tags:v* + pull_request:main + workflow_dispatch with conditional push=false on PRs; deploy + verify both gated on vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED == 'true', no-op until VM provisioned post-merge) + docs/runbooks/oracle-deploy.md (10 sections + Operational invariants appendix taking a fresh Oracle Always Free tenancy to green https://api.lotusgift.com/healthz in ~60min) + docs/research/phase-0-oracle-runbook.md (retrieval-dated 2026-05-13, 17 sources, 15 logged decisions). New 'build-push' CI context wired into infrastructure/github/branch-protection.json + README required-checks table row #14. COMPLETED 2026-05-13 via PR #13 squash b6067aca (4 commits squashed: initial + pull_request trigger + ignoreDeprecations rollback after CI TS5103 + 8-of-8 Copilot review fixes). 36 files / +2235 / -10. Tracked under Phase-0 Epic #4."
    status: completed
  - id: p0-future-docs
    content: 'PR-8 docs(runbook): Phase-0 closeout. 7 runbooks at medium depth (github-setup.md template) + 1 runbooks index + 3 cross-reference edits + 1 research note. docs/runbooks/{going-to-production, scaling-up (microservice split + Atlas M0→M10 + PostHog India DPDP + mobile apps + FBA-style warehouses + Upstash → self-hosted Redis), free-tier-burn (documents existing scripts/free-tier-quota-burn.ts + workflow), incident-response (SEV-1/2/3 + RFC 5424 mapping + 5-whys post-mortem template + vendor-neutral status-page templates), backup-restore (Atlas mongodump on-VM systemd cron spec + Upstash RDB export spec + R2 versioning + lifecycle + Bucket Lock + quarterly restore drill), oracle-quarterly-review (replaces oracle-deploy.md §10 inline checklist; cert renewal + 14-command audit-drift + fail2ban + billing + SSH key rotation + Docker hygiene + heartbeat health)}.md + docs/runbooks/local-development.md (NEW, +1 beyond parent plan per user host-installed-Mongo/Redis preference; host install via apt/brew/winget per OS as team default, docker compose stack at infrastructure/docker/ kept as fallback) + docs/runbooks/README.md (NEW runbooks index grouped by lifecycle: bootstrap/daily/launch/scaling/recovery/quarterly) + README.md "Local development" section + infrastructure/docker/README.md "Who is this for?" callout + tiny oracle-deploy.md §10 forward-pointer edit + docs/research/phase-0-future-docs.md (20 retrieval-dated 2026-05-14 sources, 11 logged decisions, 5 open questions). Docs-only PR; no CI surface changes; markdownlint is the only gate that exercises content. COMPLETED 2026-05-14 via PR #14 squash 4f1545e6 (2 commits squashed: initial 13-file + 7-file Copilot-review fix). 13 files / +1730 / -33. Addressed all 13 Copilot review comments (wrong cron `*/6 * * * *` -> systemd `OnCalendar=*-*-* 00/6:00:00`; RDB-via-redis-cli misconception fixed; broken anchors #audit-drift-detection + #6-post-mortem-template + #8-rollback-trigger; cron schedule alignment; Atlas 0.0.0.0/0 dropped for runner IP ranges; Upstash daily-vs-monthly unit fix; secrets-workflow-wiring gap documented; research-note checklist ticked; Atlas Network Access reconciled with on-VM backup spec; runbooks/README CI-gate understatement corrected). Tracked under Phase-0 Epic #4. **Phase 0 closeout complete; Epic #4 + Phase-Acceptance #5 closed.**'
    status: completed
  - id: p0-github-setup-runbook
    content: 'PR-0a docs(runbook): create docs/runbooks/github-setup.md capturing the user-driven steps (repo visibility flip to public, PAT scope verification, Projects v2 board creation, 4 custom fields, auto-add workflow, link to repo). Pre-requisite for p0-issues. Target repo: goldr0g3r/lotusgift. COMPLETED 2026-05-13 via PR #11 squash 48842d70. 167-line runbook with 8 sections (visibility flip, PAT scopes, Projects v2 creation, 4 custom fields, auto-add workflow, milestones+labels bootstrap, gh CLI install + proxy + auth, verification commands) + Operational invariants section. Tracked under Phase-0 Epic #4.'
    status: completed
  - id: p0-issues
    content: 'GitHub MCP + gh CLI (installed via winget at PR-2): 23 milestones (Phase 0 → Phase 22; P3b/P8b/P9b/P9c share their parent milestone) via gh api repos/goldr0g3r/lotusgift/milestones + full label set via gh label create + Phase-0 Research-Note + Epic + Phase-Acceptance issues via MCP issue_write (auto-added to Projects v2 board via the Step-5 workflow). Set CODEOWNERS + branch protection on main via gh api .../branches/main/protection. PAUSE before opening P1+ issues. COMPLETED 2026-05-12 via P0-rules retro-sync sub-plan: 23 milestones (#1 Phase 0 - Foundation Reset .. #23 Phase 22 - Launch), 52 labels (10 type/* + 23 phase/* + 4 prio/* + 5 area/* + 10 special), 3 Phase-0 issues (#3 Research-Note closed, #4 Epic open, #5 Phase-Acceptance open) all added to project board with Phase/Workstream/Layer/Type/Status fields set. CODEOWNERS + branch protection deferred to PR-4 (p0-ci).'
    status: completed
  - id: p1
    content: 'Phase 1: @repo/typescript-config + @repo/eslint-config + @repo/jest-config + @repo/prettier-config polish. DONE via PR-9 (sub-plan .cursor/plans/p1_shared_configs_pr-9_c3e29291.plan.md, squash-merged 2026-05-14 as b1edea2). Scope: full polish in one PR; TS 6 modernize (module + moduleResolution Node10 -> Node16 on nestjs.json; baseUrl dropped on api-gateway + @repo/api); 10-file .js-extension cascade across apps/api-gateway/src; new typescript-config/library.json + test.json; new jest-config/library.ts with commented-out tier-gated coverage thresholds (80/85/90); @repo/prettier-config canonicalised as .mjs (Node-loadable, no compile step); 4 new READMEs (typescript-config, eslint-config, prettier-config, jest-config). 4 commits squashed (initial + Dockerfile prettier-config include + Copilot review 5 items + lockfile re-sync). Closes Phase-1 Epic #15 + Phase-Acceptance #16 (Phase 1 is single-PR). Validated locally: 36/36 lint + 33/33 check-types + 5/5 test + 8/8 build + api-gateway 4/4 specs all green; CI: all 16 required checks green on the merge SHA.'
    status: completed
  - id: p2
    content: 'Phase 2: @repo/types + @repo/validators (Zod) + @repo/events (transport-agnostic event schemas + __schemaVersion) + @repo/openapi-spec (shared x-* extensions + RFC 9457 error envelope). DONE via PR-10 (sub-plan .cursor/plans/p2_l1_leaf_packages_pr-10_8329fb87.plan.md, squash-merged 2026-05-14 as 921d51e). Scope: full polish in one PR; foundation + 16-service skeleton folders per user foundation_plus_all decision. Zod 4.4.3 adopted directly (was transitive). nestjs-zod stays at L4 (api-gateway). RFC 9457 library choice deferred to P4 (only the wire-format Zod + JSON Schema ship here). 80+ files across 4 packages: @repo/types (10 branded scalars + 9 enums + pagination + audit), @repo/validators (Zod 4 schemas with India-specific regex + 16-service subpath shells + ProblemDetailsSchema), @repo/events (BaseEventEnvelopeSchema + version helpers + OutboxRowSchema + defineEvent builder + 16-service subpath shells), @repo/openapi-spec (5 x-* extension constants + ProblemDetailsJsonSchema via Zod 4 native + LotusGift error-code catalog). 8 test suites / 96 tests; 100% coverage on tested files; tier-gated 80% threshold enforced per .cursor/rules/test-coverage.mdc. Single commit squashed (Copilot review: no comments — clean). Closes Phase-2 Epic #18 + Phase-Acceptance #19 (Phase 2 is single-PR). Validated locally: 33/33 check-types + 36/36 lint + 8/8 test + 8/8 build + dep-cruiser 0 errors + markdownlint 0 errors; CI: all 16 required checks green on the merge SHA.'
    status: completed
  - id: p3
    content: 'Phase 3: @repo/database (Mongoose + collection-namespace helper) + @repo/config (env Zod schema) + @repo/utils (OutboxPort + redactor + ulid trace-id + pino logger + retry) + @repo/observability (OTEL bootstrap + RUM SDK init). DONE via PR-11 (sub-plan .cursor/plans/p3_l2_platform_packages_pr-11_6726a624.plan.md, squash-merged 2026-05-14 as 1056c9a). Scope: full polish in one PR; OTEL-only (Sentry deferred to P21, PostHog to P3b); OutboxPort full MVP at L2 (interface + MongoOutboxRepository + InProcessOutboxPort relayer with EventEmitter + LRU idempotency dedup + per-listener retry + currentTick-tracked drain), Nest binding at L4 (P4). 50+ files across 4 packages: @repo/database (Mongoose 8 connection singleton-per-URI + namespace helper with 16-service allow-list + base-schema plugin + outbox.events collection + withTransaction), @repo/config (Zod port of legacy Joi schema with superRefine prod guards + aggregating ConfigValidationError + root .env.example), @repo/utils (ulid + AsyncLocalStorage trace-id + redactor with default PII paths via structuredClone + pino-9 logger with OTEL trace-id mixin + retry with full-jitter + AbortSignal + OutboxPort surface), @repo/observability (NodeSDK bootstrap with selective http+mongoose instrumentations targeting Grafana Cloud OTLP + shutdownOtel + recordHealth gauge). 12 turbo test tasks / 51 individual tests across 12 suites. 3 commits squashed (initial + Copilot 5 high-confidence items + Copilot 2 low-confidence correctness items: per-listener retry to avoid double-firing successful subscribers; stop() tracks currentTick promise). Closes Phase-3 Epic #21 + Phase-Acceptance #22 (Phase 3 is single-PR). Validated locally: 33/33 check-types + 36/36 lint + 12/12 test + 8/8 build + dep-cruiser 0 errors + markdownlint 0 errors; CI: all 16 required checks green on the merge SHA.'
    status: in_progress
  - id: p3b
    content: 'Phase 3b: @repo/analytics-sdk (PostHog browser+server) + @repo/feature-flags (PostHog flags) + event taxonomy doc. DONE via PR-12 (sub-plan .cursor/plans/p3b_l3_analytics_flags_pr-12_autonomous.plan.md, squash-merged 2026-05-14 as 9088eee). Scope: single PR-12; server/browser subpath split; server-side PII auto-redaction via @repo/utils.redact; 60s LRU flag cache on server; React hooks deferred to each app to keep L3 framework-free. 22 files across 2 packages + docs/analytics/events.md catalog (40+ events organized by service phase). 33 tests across 3 suites (analytics-sdk event-name 14 + server 12, feature-flags server 7); 14 turbo test tasks (was 12). 2 commits squashed (initial + markdownlint MD022 fix on sub-plan). Closes Phase-3b Epic #24 + Phase-Acceptance #25; Phase 3 milestone (#4) closed (P3 + P3b complete).'
    status: completed
  - id: p4
    content: 'Phase 4: apps/api-gateway modular-monolith shell. DONE via PR-13 (squash-merged 2026-05-14 as b8e8b2c). Scope: shell-only (Better-Auth + rate-limit are stubs gated for P5); main.ts production bootstrap (bodyParser:false + rawBody + OTEL bootstrap-before-nest + Helmet with CSP relaxed on /api/docs* + structured CORS + Pino logger + cleanupOpenApiDoc + Swagger UI at /api/docs + JSON at /api/docs-json + graceful SIGTERM/SIGINT); app.module.ts wires ConfigModule + MongooseModule + nestjs-pino + GlobalProblemDetailsFilter (RFC 9457) + global ZodValidationPipe + ZodSerializerInterceptor + TraceIdMiddleware + OUTBOX_PORT provider with lifecycle. /readyz probes Mongo readyState. kubb.config.ts + export-openapi.ts placeholder pipeline + pnpm api:generate script. 2 commits squashed (initial + Dockerfile fix for 8 missing workspace package.json COPY entries). 14/14 turbo test tasks + 6 new api-gateway tests across 4 suites. Closes Phase-4 Epic #27 + Phase-Acceptance #28; Phase 4 milestone (#5) closed.'
    status: completed
  - id: p5
    content: 'Phase 5 + Phase 5b DONE via PR-14 (scaffold, squash 9686881) + PR-15 (runtime, squash 1f0d27c0). Combined scope: services/auth-service (buildBetterAuthOptions + 3 decorators + 3 DI tokens AUTH_INSTANCE/AUTH_MONGO_CLIENT/AUTH_NODE_HANDLER + AuthServiceModule.forRoot(env) async dynamic-import providers wiring the real betterAuth(...) instance + AuthGuard global default-deny + Better-Auth-owned lotusgift_auth database isolation + OnApplicationShutdown lifecycle close) + @repo/auth-client browser SDK (organizationClient + adminClient + passkeyClient + twoFactorClient + phoneNumberClient with project-owned LotusGiftAuthClient type) + apps/api-gateway main.ts replacement of P4 503 stub with toNodeHandler(auth) mounted on Express adapter BEFORE express.json() + @AllowAnonymous() on HealthController + AppController + LinksController + Dockerfile workspace COPY additions. Plugin set: admin + organization + passkey (@better-auth/passkey 1.6.11) + twoFactor TOTP + phoneNumber with MSG91 sendOTP + Google socialProviders (gated on env presence) + email-verify/password-reset stubs (TODO P12 @lotusgift/notification-service). CJS↔ESM interop via dynamic await import() inside useFactory; no "type": "module" cascade. Decisions: peer-dep Nest framework packages so DI singletons are shared; lotusgift_auth db isolation for Better-Auth-owned collections (Atlas M0 permits multi-db on a cluster); inline nodeHeadersToFetchHeaders helper avoids ESM-only better-auth/node import on the AuthGuard hot path; adapter-agnostic AuthNodeHandler type removes Express coupling from the library; reset/verification stubs log only redacted email (token-in-URL leakage avoided); MSG91 fail-fast on partial config or production with vars unset. Tests: 3 new specs / 11 tests in auth-service (auth.guard + auth-service.module + msg91). Validated: 33/33 check-types + 36/36 lint + 15/15 turbo test + 8/8 build + 0 dep-cruiser + 0 markdownlint errors locally + all 16 required CI checks green on PR-15 squash. Copilot 15 inline comments addressed in commit 686a8fa. Phase 5 milestone (#6) closed. Phase 5 Epic #31 + Phase-Acceptance #30 (MVP) + Phase 5b Epic #33 + Phase-Acceptance #34 all closed.'
    status: completed
  - id: p6
    content: 'Phase 6 DONE via PR-16 (sub-plan .cursor/plans/p6_vendor_service_pr-16_73c63961.plan.md, squash-merged 2026-05-15 as 0456d4c). Scope: services/vendor-service end-to-end (6 Mongoose schemas with 2dsphere indexes on location + serviceZone.polygon + 8 services + 7 controllers + RoleGuard + RequireRole decorator + VendorOwnershipGuard + 6-step linear onboarding state-machine via inline exhaustive-switch + OSM Nominatim geocoder with 1 req/sec semaphore + 24h LRU cache + 10s AbortController timeout + dual-mode service-zone discriminated union (pincodes OR GeoJSON MultiPolygon with 2dsphere index for $geoWithin queries from P11) + Better-Auth vendor-org binding via vendor.orgId FK onto the isolated lotusgift_auth database from P5b) + apps/api-gateway wiring (new @Global() OutboxModule so service modules can @Inject(OUTBOX_PORT) — root-scope providers aren''t visible to imports without @Global). Populates the P2 empty shells (@repo/validators/vendor — 12 files including inline GSTIN mod-36 Luhn checksum since gstin-validator npm was last published Sept 2020; @repo/events/vendor — 5 v1 outbox events; @repo/types/india.ts — ISO 3166-2:IN 28 states + 8 UTs + branded IFSC/UpiVpa/PanIndia scalars). 5 outbox events emit inside withTransaction(connection, session => { ... }) per D18 (event-driven-discipline.mdc); analytics capture fires POST-commit so failed Mongo writes never ghost-emit. Authorization layered as: global P5b AuthGuard (default-deny) + per-endpoint @RequireRole (''admin'') + RoleGuard for admin endpoints + VendorOwnershipGuard (resolves :vendorId → vendor.orgId → session.activeOrganizationId match OR admin bypass) for vendor-scoped reads/writes. Q1-Q5 answers baked as D22-D26: OSM Nominatim with MapMyIndia upgrade-path; KYC = regex+checksum at MVP + Razorpay fund-account-API enrichment parked to P10 via vendor.kyc-submitted.v1 subscriber; tier warehouse caps Starter=1/Growth=5/Enterprise=∞ (HARD 422 WAREHOUSE_TIER_LIMIT_EXCEEDED); HARD admin-approve gate for every vendor; read-only payouts + SLA-score endpoints with writers deferred to P10/P21. 84 files / +6264 / -49 across 2 commits squashed (initial 81-file wire + 25-file Copilot review fix). 42 individual tests across 7 spec files (kyc.service + warehouse.service + tier.service + onboarding.service + onboarding.apply-step + vendor.service + require-role + events round-trip + gstin-checksum). New L4 conventions established: @nestjs/mongoose 11 adopted at L4 first time (D20); Nest framework packages + mongoose declared as peerDependencies per P5b D14 (D21); withTransaction + session is the only correct outbox pattern (the lesson worth carrying into P7); createZodDto can''t extend discriminated unions (TS 2509) so the admin-decision + onboarding-step endpoints keep manual Schema.parse(raw) with explanatory comments. Copilot left 26 inline review comments addressed in a single follow-up commit (transactional outbox refactor + ownership guards + DTO pattern + onboarding tier-ordering fix + Nominatim timeout + PostHog shutdown hook + applyStep state-machine test). Validated locally: 33/33 check-types + 36/36 lint + 16/16 turbo test + 8/8 build + dep-cruiser 0 errors + markdownlint 0 errors; CI: all 16 required checks green on both commits. Closes Phase-6 Epic #36 + Phase-Acceptance #37 (both closed); Phase 6 milestone (#7) closed.'
    status: completed
  - id: p7
    content: 'Phase 7 IN PROGRESS via PR-17 (sub-plan .cursor/plans/p7_product-service_pr-17_a94f79e1.plan.md, branch pr-17-product-service). Scope: services/product-service module — corporate-gifting taxonomy (occasion / recipientType / categoryL1+L2 2-level flat enum / customizable / brandingAreas / moq / leadTimeDays / sampleAvailable / hsnCode) + Cloudflare R2 image upload via S3-compatible presigned PUT URLs (15min expiry + 5MB max + image/jpeg|png|webp allow-list) + 5 outbox events (product.published.v1 / unpublished.v1 / variant-added.v1 / image-confirmed.v1 / review-approved.v1) + MongoDB Atlas Search index sync via product.search_index denormalized snapshot collection (M0 fallback; $search swap parked to scaling-up.md tier upgrade) + admin product-review moderation queue + vendor-scoped CRUD gated by ProductOwnershipGuard + VendorActiveGuard (asserts vendor.status === ACTIVATED via cross-service VendorService read). Introduces the StockReadPort interface at @repo/utils + StubStockReadPort at apps/api-gateway/src/app.module.ts (real Redis-backed impl in P8 inventory-service). 15 D-decisions + Q1–Q5 defaults baked (presigned R2 uploads, Mongoose subdoc-array variants, 2-level flat category enum, page-based pagination, auto-rebuild Atlas Search mapping via existing CI workflow). Populates the empty P2 shells in @repo/validators/product (10 files) + @repo/events/product (5 v1 events) + extends @repo/types with product.ts taxonomy enums + branded HsnCode/R2ImageKey. New doc: docs/architecture/cross-service-contracts.md formalizes the cross-module port pattern (StockReadPort first; ShippingRateReadPort + TaxComputePort + PaymentCapturePort + NotificationDispatchPort listed as upcoming).'
    status: in_progress
  - id: p8
    content: 'Phase 8: services/inventory-service module — per-(variantId, warehouseId) stock ledger + per-warehouse Redis TTL reservations + per-warehouse low-stock + dead-stock + reorder feeds + availability query API + inter-warehouse transfer event model (admin-CLI-driven MVP) + per-warehouse inventory adjustments audit log.'
    status: pending
  - id: p8b
    content: 'Phase 8b NEW: services/customization-service module — versioned art file upload to R2 (whitelist: .ai / .pdf / .png; virus-scan integration parked) + mockup workflow (vendor uploads mockup → buyer approves/rejects with notes) + state machine (DRAFT → ART_UPLOADED → MOCKUP_PENDING → MOCKUP_DELIVERED → APPROVED|REJECTED → IN_PRODUCTION) + audit log on every transition + in-app message thread scoped to a CustomizationRequest. Outbox emits customization.* events consumed by notification-service.'
    status: pending
  - id: p9
    content: 'Phase 9: services/order-service module — multi-recipient order model (Order aggregates N Shipments, each with (warehouseId, vendorId, recipientAddress, personalization, customizationRequestId?)); saga orchestrator (fans out per-shipment inventory reservation + shipping-rate quote + tax-compute; payment authorised once for order total; per-shipment compensation on partial failure) + auto-routing call into rfq-service.routeDraft() at checkout (routes to RFQ when MOQ/value threshold exceeded OR customization required).'
    status: pending
  - id: p9b
    content: 'Phase 9b NEW: services/rfq-service module — Quote workflow (DRAFT → SENT → NEGOTIATING → ACCEPTED → REJECTED → EXPIRED) + auto-router policy (per-vendor configurable thresholds with platform defaults: cart value, per-product MOQ, requires-customization flag) + negotiated pricing per line item + quote-to-PO conversion (creates Order via order-service) + attachments + quote validity period. Replaces and extends _old/apps/api/src/quotes.'
    status: pending
  - id: p9c
    content: 'Phase 9c NEW: services/recipient-list-service module — CSV/Excel upload + Zod-validated parsing + fixed-schema recipient row (name, address-line-1, address-line-2, city, state, pincode, phone, custom-message, variant-sku optional, billing-GSTIN optional) + per-recipient personalization payload + recipient-list-driven order generation (one upload → one Order with N Shipments via order-service saga).'
    status: pending
  - id: p10
    content: 'Phase 10: services/payment-service module — Razorpay UPI + cards + netbanking + wallets + COD with risk scoring + refunds + signed-webhook handler (preserve apps/api/src/main.ts raw-body capture pattern) + idempotency table + settlement reconciliation + PO + credit-terms path for approved corporate-buyer-orgs (Net-15 / Net-30 with credit-limit enforcement at order placement).'
    status: pending
  - id: p11
    content: 'Phase 11: services/shipping-service module — Shiprocket primary + Delhivery + Bluedart adapters + per-warehouse pickup origin (one pickup for many destination recipients) + per-warehouse + per-customer-pincode rate cache + per-warehouse pickup-OTP (visible only to assigned warehouse-manager/inventory-manager) + pickup SLA + carrier cut-off times + tracking webhooks + RTO routing back to originating warehouse.'
    status: pending
  - id: p12
    content: 'Phase 12: services/notification-service module — email via Resend + SMS via MSG91 + WhatsApp Cloud via MSG91 + in-app stream + Web Push. Consumes outbox events from all services.'
    status: pending
  - id: p13
    content: 'Phase 13: services/tax-service module — GST computation per shipment (origin = fulfilling warehouse state; destination = recipient address state; CGST/SGST when same-state, IGST when interstate) + HSN registry per product + IRP e-invoice default-on for B2B (corporate-buyer-org with GSTIN) + per-shipment e-invoice (one e-invoice per shipment) + TCS reporting for marketplace operator.'
    status: pending
  - id: p14
    content: 'Phase 14: services/promotions-service module — coupons + vendor subscription tiers + vendor-defined volume discount rules at product level (auto-applied at cart) + referral + auto-replenish subscriptions (recurring corporate gifting: monthly engagement gifts, quarterly client appreciation). Razorpay Subscriptions API. NO Customer Prime.'
    status: pending
  - id: p15
    content: 'Phase 15: services/insights-service module — vendor AI (demand forecasting + dead-stock + reorder-point + seasonal + dynamic-pricing recommendations). Reads PostHog cohort exports + Mongo aggregates.'
    status: pending
  - id: p16
    content: 'Phase 16: apps/web-customer (Next.js + Radix + CSS Modules + TanStack Query). Design Discovery FIRST per page family (home reusing existing HeroSlider/TrustBar/CategoryMosaic look, PLP, PDP with customization preview + qty selector + auto-route hint banner when MOQ exceeded, cart with split-shipment summary, checkout with auto-route to RFQ when threshold tripped, GSTIN field, account, recipient-list uploader for bulk drop-ship, my-quotes, my-orders, customization threads, wishlist).'
    status: pending
  - id: p17
    content: 'Phase 17: apps/web-vendor — Design Discovery FIRST (self-serve onboarding wizard, catalog, orders filtered by warehouse, warehouses add/edit wizard, per-warehouse stock + low-stock + dead-stock alerts, warehouse-manager/inventory-manager team-membership assignment, per-warehouse SLA scorecard, customization queue with mockup upload, quotes/RFQ inbox with negotiation thread, payouts, insights dashboards, tier-upsell).'
    status: pending
  - id: p18
    content: 'Phase 18: apps/web-admin — Design Discovery FIRST (user/vendor/product/corporate-buyer-org moderation, vendor activation queue, KYC review, credit-limit underwriting, finance, GMV dashboards, disputes, feature-flag console, auto-routing policy configurator).'
    status: pending
  - id: p19
    content: 'Phase 19: apps/web-customer-service — Design Discovery FIRST (ticket queue, conversation view, customer 360, refund/RMA wizard, customization-thread monitoring, RFQ assistance).'
    status: pending
  - id: p20
    content: 'Phase 20: services/review-service + services/support-service modules (tickets, RMA, warranty, sentiment via insights, customization-quality reviews).'
    status: pending
  - id: p21
    content: 'Phase 21: observability hardening — Grafana Cloud dashboards + alert rules + Loki queries + Tempo trace correlation + RUM via PostHog + runbooks.'
    status: pending
  - id: p22
    content: 'Phase 22: launch — execute docs/runbooks/going-to-production.md checklist. Vercel Hobby → Pro for 4 apps. Razorpay live. Shiprocket/Delhivery/Bluedart live. Smoke load test. OWASP ASVS L2 self-audit. SBOM. DR drill. Announcement. Onboard first non-LotusGift vendor.'
    status: pending
isProject: false
---

# LotusGift v2 — Architecture & Phase Plan

## 1. Recommendation (TL;DR)

**Yes, redo the architecture.** The current `apps/web` + `apps/api` stack is functional but single-vendor, single-warehouse, RFQ-only, and the redesigned UI is running against mocks (`apps/web/lib/api.ts`, `apps/web/lib/auth-client.ts`) — there is no production data to preserve. The nursery-plan architecture is a near-perfect fit for your stated needs, with three corporate-gifting-specific extensions:

- **AUTO-ROUTING** between instant Cart and RFQ (small orders → cart, large/customized → RFQ).
- **DEEP customization workflow** (art upload → mockup → approval → audit + in-app thread).
- **RECIPIENT-LIST drop-shipping** (CSV upload → N shipments to N recipients with per-recipient personalization).

The customer frontend's visual identity (brand-green, brand-pink, brand-ink palette + Plus Jakarta Sans + Geist + custom utilities like `btn-pink` / `eyebrow` / `h1-display`) is preserved 1:1 via `@repo/design-tokens` and re-implemented on Radix Primitives + CSS Modules + Sass (per nursery plan), in 4 separate Next.js apps deployed to Vercel.

Verified-current 2026 stack (latest docs, this session): NestJS 11 + nestjs-zod 5.3 + `@thallesp/nestjs-better-auth` 2.6 (Better-Auth ≥1.5) + Kubb 3 with `@kubb/plugin-react-query` + Mongoose 8 + Atlas M0 (3 search indexes / <2M docs / <10GB included) + Oracle Always Free A1.Flex 4 OCPU/24 GB ARM (7-day idle reclaim, heartbeat-mitigable).

## 2. Comparison summary

**Current LotusGift** ([apps/api/src/app.module.ts](apps/api/src/app.module.ts), [apps/web/app/layout.tsx](apps/web/app/layout.tsx), [docs/architecture.md](docs/architecture.md)):

- 2 apps (1 Next.js + 1 NestJS), 13 NestJS modules in one root, Mongoose + class-validator + Joi env, Tailwind v3 with custom palette, single-vendor, no warehouse, RFQ + Cart in parallel, mocks not wired to API ([apps/web/lib/api.ts](apps/web/lib/api.ts) returns mock data).

**Nursery plan** ([nursery-plan.md](nursery-plan.md), 509 lines): modular-monolith NestJS with `services/*` as Nest libraries mounted by `apps/api-gateway`, 4 Next.js apps, OutboxPort + transport-agnostic events, nestjs-zod + Kubb → `@repo/api` TanStack Query hooks, Atlas Search, Radix + CSS Modules + Sass, Oracle + Vercel, full observability (Sentry + Grafana + PostHog), 22 phases gated by research-note → epic → PRs.

**LotusGift v2** (this plan): nursery-plan architecture + 3 corporate-gifting services added (`rfq-service`, `customization-service`, `recipient-list-service`), corporate-gifting taxonomy on `product-service`, multi-recipient order model on `order-service`, drop Customer Prime, preserve `@thallesp/nestjs-better-auth` pattern (already used in current API), preserve visual design via tokens.

## 3. Target architecture

```mermaid
flowchart TB
  subgraph Vercel [Vercel - 4 Next.js apps]
    WC[web-customer]
    WV[web-vendor]
    WA[web-admin]
    WS[web-customer-service]
  end

  subgraph Oracle [Oracle Cloud Always Free Mumbai]
    NGINX[nginx + Lets Encrypt]
    GW[apps/api-gateway<br/>NestJS modular monolith]
    NGINX --> GW
    GW --> AUTH[auth-service]
    GW --> VEND[vendor-service]
    GW --> PROD[product-service + Atlas Search]
    GW --> INV[inventory-service]
    GW --> CUST[customization-service]
    GW --> RFQ[rfq-service]
    GW --> RECL[recipient-list-service]
    GW --> ORD[order-service]
    GW --> PAY[payment-service]
    GW --> SHIP[shipping-service]
    GW --> TAX[tax-service]
    GW --> PROMO[promotions-service]
    GW --> NOTIF[notification-service]
    GW --> INS[insights-service]
    GW --> REV[review-service]
    GW --> SUP[support-service]
  end

  Bus[OutboxPort<br/>in-process EventEmitter MVP]
  AUTH -. events .-> Bus
  VEND -. events .-> Bus
  PROD -. events .-> Bus
  INV -. events .-> Bus
  CUST -. events .-> Bus
  RFQ -. events .-> Bus
  ORD -. events .-> Bus
  PAY -. events .-> Bus
  SHIP -. events .-> Bus
  Bus -. events .-> NOTIF
  Bus -. events .-> INS

  WC --> CF[Cloudflare DNS + CDN]
  WV --> CF
  WA --> CF
  WS --> CF
  CF --> NGINX

  MONGO[(MongoDB Atlas M0 AWS Mumbai<br/>collection-namespaced + Atlas Search)]
  REDIS[(Upstash Redis Mumbai)]
  R2[(Cloudflare R2<br/>images + art files + invoices)]
  RZP[Razorpay]
  CARRIER[Shiprocket + Delhivery + Bluedart]
  IRP[GST IRP e-invoice]
  MSG[Resend + MSG91 + WhatsApp Cloud]

  GW --> MONGO
  GW --> REDIS
  PROD --> R2
  CUST --> R2
  PAY --> RZP
  SHIP --> CARRIER
  TAX --> IRP
  NOTIF --> MSG

  SENTRY[Sentry]
  GRAFANA[Grafana Cloud]
  POSTHOG[PostHog Cloud EU]
  GW -. errors .-> SENTRY
  GW -. logs+traces .-> GRAFANA
  GW -. server events .-> POSTHOG
```

## 4. Key deltas from the nursery plan

**ADDED services (corporate-gifting specific):**

- `rfq-service` — Quote workflow + auto-router. `RouteDecisionPolicy(orderDraft) → 'cart' | 'rfq'` based on configurable thresholds (per-product MOQ, cart value, requires-customization flag). Carries: `Quote { quoteNumber, status: DRAFT|SENT|NEGOTIATING|ACCEPTED|REJECTED|EXPIRED, lineItems, negotiatedPricing, validUntil, attachments }`. Quote-to-PO conversion creates an `Order` via order-service. Replaces and extends the current [apps/api/src/quotes](apps/api/src/quotes) module.
- `customization-service` — Versioned art files in R2 (`art:<orgId>/<lineItemId>/v<n>.{ai,pdf,png}`), mockup-render workflow (vendor uploads mockup → buyer approves/rejects with notes), audit log of every state transition, in-app message thread scoped to a customization request. Used by `rfq-service` and `order-service`.
- `recipient-list-service` — CSV/Excel upload + Zod-validated parsing + per-recipient personalization payload (name on package, custom message, size variant, address, GSTIN if billed separately). One recipient-list-driven order produces N shipments via order-service's saga.

**MODIFIED services (vs nursery plan):**

- `product-service` — Corporate-gifting taxonomy in place of plant taxonomy: `occasion[]` (Diwali / Christmas / employee-anniversary / new-joiner / client-gifting / general), `recipientType[]` (employees / clients / partners), `customizable: boolean`, `brandingAreas[]` (front / back / sleeve / box / engraving / embroidery), `moq`, `leadTimeDays`, `sampleAvailable`, `hsnCode`. Vendor-scoped + per-warehouse stock joined at read time.
- `order-service` — Multi-recipient model. An `Order` aggregates N `Shipment`s, each with `(warehouseId, vendorId, recipientAddress, personalization, customizationRequestId?)`. Saga fans out per-shipment inventory + shipping-quote + tax-compute; payment authorised once for order total; per-shipment compensation on partial failure. Auto-routing call into `rfq-service.routeDraft()` at "Checkout" click — if it returns RFQ, the cart converts to a draft quote and the buyer is redirected to the RFQ thread.
- `auth-service` — Three Better-Auth `organization` plugin org types: `vendor-org` (with self-serve onboarding + admin approval gate before activation), `corporate-buyer-org` (NEW — corporate buyers with KYC + PO terms + credit limit + multi-stakeholder approval matrix), `internal-staff-org`. Individual retail buyers still allowed (no org).
- `promotions-service` — Drop Customer Prime. Keep vendor tiers + volume discounts + coupons + auto-replenish (used for recurring corporate gifting like monthly engagement gifts / quarterly client appreciation).
- `tax-service` — Default-on GST e-invoice for B2B (corporate-buyer-org GSTIN is always present after KYC). Per-shipment origin-state computed from fulfilling warehouse.
- `payment-service` — Add PO + credit-terms path for approved `corporate-buyer-org`s (Net-15 / Net-30 with credit limit enforcement). Razorpay still primary for non-credit orders.
- `shipping-service` — Per-warehouse pickup + per-recipient drop-off addresses (many destinations from one pickup), pickup-OTP per warehouse, RTO routing back to originating warehouse.

**REMOVED (vs nursery plan):**

- Customer Prime subscription (consumer plan, irrelevant for B2B corporate gifting).
- Plant taxonomy / pincode-fenced retail PLP / nursery-specific UX (compostable-pot filters, hardiness-zone search, etc.).
- Anonymous/guest checkout (corporate buyers MUST be authenticated + KYC'd for GST e-invoicing; retail still allowed if you want — parked decision).
- PWA offline-cart (corporate buyers use desktop, not mobile/offline).

## 5. Design system: preserve the look on the new stack

The visual identity moves into `packages/design-tokens` (TS source-of-truth, emits typed TS + SCSS variables + JSON for Figma sync) and `packages/ui` (Radix Primitives + CSS Modules + Sass, no Tailwind).

**Tokens captured from current [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts) + [apps/web/app/layout.tsx](apps/web/app/layout.tsx):**

- Colors: `brand.green.{50..950}` (50=#E6F4ED, 500=#02783C, 900=#01331B), `brand.pink.{50..950}` (500=#F01282, 900=#4A052B), `brand.ink.{50..900}` (700=#2F2F38, 900=#0E0E13), stone scale (Tailwind defaults).
- Typography: Plus Jakarta Sans (sans + display, weights 400-800), Geist Sans + Geist Mono (local woff fallbacks via `next/font/local`).
- Radius: `4xl=2rem`, `5xl=2.5rem`, organic blob `40%_60%_55%_45%/55%_45%_55%_45%` (used in HeroSlider product hero).
- Shadow: `panel`, `pill`, `soft`, `elevated`, `elevated-lg`, `glow`, `glow-pink`.
- Animation keyframes: `fade-in-up`, `fade-in`, `slide-down`, `slide-up`, `slide-in-right`, `slide-in-left`, `scale-in`, `shimmer`, `float`, `spin-slow`, `pulse-soft`, `marquee`, `ken-burns`.
- Semantic utility classes (carried forward as Sass mixins): `btn-primary`, `btn-pink`, `btn-outline`, `btn-disc`, `btn-lg`, `eyebrow`, `h1-display`, `icon-circle`, `badge-soft`.

**`@repo/ui` re-implementation list (Radix-backed):**

- Primitives to port from current [apps/web/components/ui/](apps/web/components/ui): `Button`, `IconButton`, `Carousel` (keep Embla under the hood), `Tabs`, `Sheet` (Radix Dialog drawer), `Dialog`, `Tooltip`, `Accordion`, `Card`, `Pill`, `Badge`, `StarRating`, `QuantityStepper`, `Toaster` (keep Sonner), `Skeleton`, `SectionShell`, `Input`, `PriceTag`, `ImageWithFallback`.
- Composite blocks to port from [apps/web/components/home/](apps/web/components/home): `HeroSlider`, `TrustBar`, `CategoryMosaic`, `BestSellers`, `FeaturedCarousel`, `PromoBanners`, `HowItWorks`, `IndustryStrip`, `TestimonialsCarousel`.
- New for corporate gifting: `RecipientListUploader`, `ArtFileVersionViewer`, `MockupApprovalCard`, `CustomizationThread`, `QuoteCard`, `CampaignProjectCard`, `GstInvoicePanel`, `POTermsPanel`.

WCAG 2.2 AA floor + `@axe-core/playwright` in CI gates every page.

## 6. What we keep / extract / discard from current code

Move ALL current top-level files/dirs (except `.git`, `.cursor`, `.github`) into `_old/` via `git mv` to preserve history before re-scaffolding. The new tree built from scratch via CLI; the `_old/` folder lives at repo root permanently as a reference (it's in source control and visible to code-search, but excluded from the new monorepo's workspace via `pnpm-workspace.yaml` ignore pattern). Then:

**Extract into the new workspace** (cite-and-port, not lift-and-shift):

- Design system: [apps/web/tailwind.config.ts](apps/web/tailwind.config.ts) → `packages/design-tokens/src/`.
- UI components: [apps/web/components/](apps/web/components) → port to `packages/ui` on Radix + CSS Modules.
- Mock data + page wireframes: [apps/web/lib/mock-data.ts](apps/web/lib/mock-data.ts) → Design Discovery seeds for P16-P19 (the existing pages are the wireframes).
- Better-Auth setup pattern: [apps/api/src/auth.ts](apps/api/src/auth.ts) + [apps/api/src/main.ts](apps/api/src/main.ts) (Better-Auth mounted before body parsing, raw-body capture for Razorpay webhooks at `/api/payments/webhook`, `toNodeHandler` wiring) → re-applied in P4 `apps/api-gateway`.
- Razorpay webhook signature + verify pattern: [apps/api/src/payments/](apps/api/src/payments) → `services/payment-service`.
- `@thallesp/nestjs-better-auth` v2.6 integration approach already in [apps/api/package.json](apps/api/package.json) — confirmed still current; reuse the global AuthGuard + `@AllowAnonymous` + `@OptionalAuth` + `@Session` decorator pattern.
- ConfigModule + Joi env validation from [apps/api/src/app.module.ts](apps/api/src/app.module.ts) → upgrade to Zod via `packages/config` (nursery-plan style).

**Discard** (entirely re-written per nursery plan):

- All current Mongoose schemas (single-vendor, no warehouse — full redesign needed) at [apps/api/src/schemas/](apps/api/src/schemas).
- All controllers + DTOs (class-validator → Zod migration).
- 13-module flat root structure → `services/*` Nest libraries mounted by `apps/api-gateway`.
- All current docs except [docs/architecture.md](docs/architecture.md) (becomes ADR-001 reference) — full rewrite per nursery plan §7.
- [apps/web/lib/api.ts](apps/web/lib/api.ts) + [apps/web/lib/auth-client.ts](apps/web/lib/auth-client.ts) mocks → replaced by Kubb-emitted TanStack Query hooks in `@repo/api` + real Better-Auth client in `@repo/auth-client`.

## 7. Phased plan (22 phases)

P0 lays foundation. P1-P3b are leaf packages. P4 is the gateway shell. P5-P15 are services (one phase each, with corporate-gifting additions). P16-P19 are the 4 Next.js apps (Design Discovery first per page family). P20-P22 close out. Every phase: research-note → epic → PRs → tests → phase-acceptance, identical to nursery-plan workflow.

## 7b. Sub-plan + status-sync workflow (per todo)

User-requested workflow, codified here so every Phase-0..Phase-22 todo follows it:

1. **Draft sub-plan** for the todo via `CreatePlan` (creates a new `.cursor/plans/<todo-id>_*.plan.md` file). Sub-plan must include: research summary with retrieval-dated URLs, file-by-file deliverables, acceptance criteria, open questions, and the status-sync closing step (item 5 below).
2. **Deep research** — `WebFetch` / `WebSearch` the latest official docs (≤14 days) for every dependency touched by the todo. Bake citations into `docs/research/phase-<N>-<topic>.md`.
3. **User review** of the sub-plan. Refinements happen via direct edits to the sub-plan markdown.
4. **Execute** (switch to agent mode) — CLI-only for scaffolding (no hand-rolled `package.json` / `tsconfig` / etc. — only `create-turbo`, `create-next-app`, `nest g library`, `pnpm dlx tsx scripts/scaffold-package.ts`).
5. **Status sync** at the end of every sub-plan's implementation:
   - Update parent plan todo `status: pending → in_progress → completed` (frontmatter array).
   - Update the GitHub Projects v2 board item: Status field `Todo → In progress → In review → Done` via `gh project item-edit`.
   - Update the linked GitHub Issue: comment with PR link, then close with `state_reason: completed` via MCP `issue_write`.
   - If a research note exists, link the PR into it as the "Implementation Reference".
6. **Loop back to plan mode** for the next todo's sub-plan.

NO step in the loop is skipped. Every PR has a sub-plan + research note + status sync, even if the todo is small.

## 8. First-wave deliverables (Phase 0, 8 PRs — reordered: archive+scaffold FIRST)

- **PR-1 `chore(scaffold)`**: Move every top-level file/dir (except `.git`, `.cursor`, `.github`) into `_old/` (preserves git history via `git mv`). Re-scaffold the workspace via `pnpm dlx create-turbo@latest --example with-nestjs --package-manager pnpm` (run in a sibling temp dir then move contents in since `.git` blocks in-place). Rename `apps/web` to `apps/web-customer` then add 3 more Next.js apps via `pnpm dlx create-next-app@latest apps/web-vendor`, `apps/web-admin`, `apps/web-customer-service` (all with `--app --typescript --src-dir --import-alias "@/*" --no-tailwind --use-pnpm`). Generate empty Nest libraries via `nest g library <name>` for each of the 16 services. Create empty packages via `pnpm dlx tsx scripts/scaffold-package.ts <name>`. Add `gh` CLI install instructions to README. CLI captures latest stable versions automatically.
- **PR-2 `chore(rules)`**: Same rule set as nursery plan + LotusGift-specific rule `corporate-gifting-domain.mdc` (auto-routing thresholds, recipient-list validation, customization workflow invariants) + `no-composer-2.mdc` (user preference codified).
- **PR-3 `docs(architecture)`**: README + dep-graph + ADR-001..ADR-007 (extra ADR-007 explains corporate-gifting deltas: auto-routing, customization, recipient-list).
- **PR-4 `ci`**: Same CI surface as nursery plan + `corporate-gifting-domain.yml` linter that asserts: every order schema change updates the auto-router test matrix.
- **PR-5 `feat(infra)`**: `infrastructure/docker/docker-compose.yml` for local dev (Mongo + Redis + Mailhog + OTEL collector).
- **PR-6 `docs(design)+feat(design-tokens)`**: `docs/design/DESIGN.md` documents LotusGift palette + voice; `@repo/design-tokens` ports the brand palette + type + shadow + animation tokens listed in §5; `@repo/ui` baseline (Button + IconButton + Card + Pill + SectionShell + Toaster).
- **PR-7 `docs(runbook)+infra(oracle)`**: Oracle deploy runbook + nginx + Certbot + UFW + fail2ban + heartbeat-ping cron (every 6h, mitigates the 7-day idle-reclaim policy confirmed in 2026 docs).
- **PR-8 `docs(runbook)`**: `going-to-production.md` + `scaling-up.md` + `free-tier-burn.md` + `incident-response.md` + `backup-restore.md` + `oracle-quarterly-review.md`. All cite live free-tier quotas with retrieval date (Atlas M0: 3 search indexes / <2M docs / <10GB; Oracle: 4 OCPU+24 GB ARM; Upstash: 10k commands/day; Vercel Hobby; PostHog 1M events/mo).

Plus, alongside via GitHub MCP / Linear MCP (parked below): 23 milestones + label set + Phase-0 Research-Note + Epic + Phase-Acceptance issues. Pause before opening P1+ issues for your review.

## 9. Hosting + free-tier strategy

- **Backend**: Oracle Cloud Always Free Mumbai A1.Flex (4 OCPU + 24 GB RAM ARM, confirmed Apr 2026 docs). Single VM runs the `apps/api-gateway` Node process (modular monolith) + nginx + Certbot. Heartbeat-ping cron mitigates 7-day 95th-percentile-<20% idle reclaim.
- **Frontend**: Vercel Hobby for dev preview → Vercel Pro at P22 launch (commercial-use compliance). 4 separate Next.js projects each bound to a subdomain.
- **Data**: MongoDB Atlas M0 (AWS Mumbai) — collection-namespaced per service module to fit the "1 cluster per project" limit. Atlas Search budget: 3 indexes total — allocated to `products` (catalog search), `vendors` (vendor directory), and `orders` (admin/CS lookup). All other search via standard Mongo queries.
- **Cache + sessions + idempotency**: Upstash Redis (AWS Mumbai free tier).
- **Objects** (catalog images + customization art files + invoices): Cloudflare R2 (free egress).
- **Email / SMS / WhatsApp**: Resend + MSG91 + WhatsApp Cloud via MSG91.
- **Observability**: Sentry (errors + replay) + Grafana Cloud (logs/traces/metrics 14-day retention) + PostHog Cloud EU (product analytics + feature flags + session replay).
- **Payments**: Razorpay live for card/UPI/netbanking/wallets; PO + credit-terms path for approved corporate-buyer-orgs.
- **Source control + project management**: GitHub repo `goldr0g3r/lotusgift` (PUBLIC after Step-1 visibility flip per `docs/runbooks/github-setup.md` — unlocks free unlimited Actions minutes, branch protection, CODEOWNERS, Rulesets) + GitHub Issues + Milestones + Labels + Projects v2 (user-level board `LotusGift v2 Roadmap` with 4 custom fields: Phase / Workstream / Layer / Type).

70%-of-quota threshold opens an upgrade-path research-note via weekly cron (`scripts/free-tier-quota-burn.ts`).

## 9b. GitHub tooling strategy

- **GitHub MCP server** (`user-github`, already configured + PAT verified May 12 2026 as `goldr0g3r`) handles: `issue_write`, `pull_request_*`, `push_files`, `create_branch`, `create_or_update_file`, `delete_file`, `get_file_contents`, `search_*`, `list_*`, `request_copilot_review`, `assign_copilot_to_issue`, `merge_pull_request`.
- **`gh` CLI** (install via `winget install --id GitHub.cli` in agent mode at PR-2 scaffold) fills the MCP gaps: `gh label create`, `gh api repos/.../milestones`, `gh api repos/.../branches/main/protection`, `gh project create/edit/field-create` (Projects v2 GraphQL), `gh ruleset` (Rulesets).
- **Direct REST/GraphQL via `Invoke-RestMethod`** is a fallback only if neither MCP nor `gh` covers the call.
- **PAT scope requirements** documented in `docs/runbooks/github-setup.md`: classic needs `repo` + `workflow` + `project`; fine-grained needs Repo:`Administration/Contents/Issues/Pull-requests/Workflows/Discussions/Variables/Secrets/Webhooks/Actions` (R/W) + Repo:`Metadata` (R) + Account:`Projects` (R/W).

## 10. Open questions (parked for relevant phase research notes)

- **P5**: Corporate-buyer-org auth — separate Better-Auth org type with its own KYC flow, or a flag on individual customer accounts with org-like fields? Recommend separate org type for clean multi-stakeholder approval matrix.
- **P5**: Apple sign-in for individual retail buyers — MVP or post-launch?
- **P7/P8b**: Customization workflow — vendor uploads mockup manually, vs system integrates with a design tool API (e.g., Figma file generation, Canva connect) for auto-mockup? Recommend manual MVP, automation in scaling-up.md.
- **P8b**: Art file format whitelist — `.ai` + `.pdf` + `.png` only, or include `.psd` / `.cdr`? Affects R2 storage + virus-scan integration.
- **P9**: Auto-routing thresholds — per-product MOQ, cart value, or both? Configurable per vendor in vendor-service settings, or platform-global? Recommend per-vendor with platform defaults.
- **P9c**: Recipient-list CSV schema — fixed columns or vendor-configurable? Per-recipient variant selection allowed or only one variant per order? Recommend fixed schema with optional variant column for MVP.
- **P10**: PO + credit-terms — credit limit underwriting workflow (admin sets per corporate-buyer-org), and what happens at limit breach (block new orders / require deposit / escalate)?
- **P13**: GST e-invoice — mandatory for all B2B in MVP, or threshold-gated per current IRP rules? Verified in P13 research note.
- **P14**: Vendor tier proration on upgrade/downgrade — daily or monthly?
- **P16**: 4-app SSO via Better-Auth — single cookie domain (`.lotusgift.com`) covering all 4 subdomains? Test cross-subdomain session in P5 research note.
- **Tooling**: GitHub Issues (nursery-plan default) vs Linear (MCP enabled in this workspace) for epics/issues — pick one before P0 GitHub-MCP step.
- **Scaling**: Trigger thresholds for `auth` / `payment` / `order` microservice split — GMV-based vs CPU-based.
