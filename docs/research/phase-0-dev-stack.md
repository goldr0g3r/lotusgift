# Phase-0 Research Note — Local Docker Compose dev stack

**Phase:** 0 (foundation)
**Topic:** Local development stack via Docker Compose v2 — Mongo + Redis + Mailpit + OpenTelemetry Collector
**Owner:** @goldr0g3r
**Status:** Implementation in progress
**Sub-plan:** [.cursor/plans/pr5-dev-stack-sub-plan_15d1e898.plan.md](../../.cursor/plans/pr5-dev-stack-sub-plan_15d1e898.plan.md)
**Parent plan:** [.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

## 1. Goal

Land **PR-5 `p0-dev-stack`** per the parent plan's PR-5 todo: a one-command `docker compose up -d` local-dev stack so every contributor can run Mongo + Redis + an SMTP catcher + an OTLP collector against `apps/api-gateway` in P4+ without provisioning anything cloud-side.

Parent plan literally says "Mailhog" but Mailhog has been unmaintained since 2024-02-13 (see citation 4). We substitute the actively-maintained drop-in replacement **Mailpit** by [@axllent](https://github.com/axllent). Same SMTP catcher + Web UI role, 10x smaller container, modern feature set (search, screenshots, API).

Scope decision (sub-plan §5): minimal. Exactly the 4 containers named in the parent plan. **No** Justfile, **no** seed scripts, **no** `.devcontainer/`, **no** Atlas Search local emulator. Those are deferred to follow-up PRs.

## 2. Retrieval-dated citations (verified May 12, 2026)

| # | Topic | Title / Page | URL | Retrieved | Version / Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | Mongo Docker image | `mongo` official image on Docker Hub | https://hub.docker.com/_/mongo | 2026-05-12 | Latest stable tag `8.0` (8.3.1 latest patch, pushed 2026-05-06). MongoDB Server 8.0 GA October 2024; `8.0` is the major LTS-floating tag. Atlas M0 currently provisions on the 7.0 server line — production-parity is acceptable to defer per sub-plan §8 Q3. |
| 2 | Redis Docker image | `redis` official image on Docker Hub | https://hub.docker.com/_/redis | 2026-05-12 | Latest `8.6.3` (pushed 2026-05-11). Redis 8 GA May 2025; built-in vector search and improved cluster mode are noteworthy for P15 (insights-service). Pin to floating `8-alpine` (matches major). |
| 3 | Mailpit image + repo | `axllent/mailpit` releases | https://github.com/axllent/mailpit/releases/tag/v1.29.7 | 2026-05-12 | v1.29.7 (released 2026-04-16). SMTP catcher on `:1025`, Web UI + REST API on `:8025`. Docker image `axllent/mailpit:v1.29`. Health check via `wget --spider -q http://localhost:8025/api/v1/info`. |
| 4 | Mailhog deprecation | `mailhog/MailHog` repository state | https://github.com/mailhog/MailHog | 2026-05-12 | Last commit pushed 2024-02-13 (~27 months stale at time of writing). Repo not formally archived but effectively unmaintained; Mailpit is the community-recognised successor (cited in countless 2024+ Mailhog issues + the project's README itself). Substitution captured in §3 D1. |
| 5 | OTEL Collector contrib | `open-telemetry/opentelemetry-collector-contrib` releases | https://github.com/open-telemetry/opentelemetry-collector-contrib/releases/tag/v0.152.0 | 2026-05-12 | v0.152.0 (released 2026-05-11). Distribution: `otel/opentelemetry-collector-contrib:0.152.0` on Docker Hub. Contrib bundle includes the wider receiver/exporter set needed at P21 (Grafana / Tempo / Loki / PostHog). |
| 6 | OTEL Collector config | OpenTelemetry Collector Configuration | https://opentelemetry.io/docs/collector/configuration/ | 2026-05-12 | Canonical config schema: `receivers`, `processors`, `exporters`, `extensions`, `service.pipelines`. OTLP receiver listens on gRPC `:4317` + HTTP `:4318` by default. The `debug` exporter (renamed from `logging` in v0.86) prints telemetry to stdout — ideal for local dev where there is no cloud destination. |
| 7 | OTLP receiver settings | OTLP Receiver README | https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/otlpreceiver/README.md | 2026-05-12 | Default config: `protocols.grpc.endpoint: 0.0.0.0:4317`, `protocols.http.endpoint: 0.0.0.0:4318`. We explicitly bind both to make the inputs clear in the YAML even though they're defaults. |
| 8 | Health check extension | `healthcheckextension` README | https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/healthcheckextension | 2026-05-12 | Provides HTTP `/` returning 200 if all pipelines healthy. Default endpoint `:13133`. We use this for the compose healthcheck. |
| 9 | Docker Compose spec | Compose file reference | https://docs.docker.com/reference/compose-file/ | 2026-05-12 | Docker Compose v2.x reads the canonical Compose Specification at https://github.com/compose-spec/compose-spec. The `version:` top-level field is obsolete and ignored — top-level keys are `services`, `networks`, `volumes`, `configs`, `secrets`. `healthcheck`, `restart`, `depends_on.condition: service_healthy` are stable. |
| 10 | Healthcheck reference | Compose `healthcheck` spec | https://docs.docker.com/reference/compose-file/services/#healthcheck | 2026-05-12 | Fields: `test`, `interval`, `timeout`, `retries`, `start_period`. Status reported via `docker compose ps` and consumable by `depends_on.condition: service_healthy`. |
| 11 | Mongo health check | MongoDB `mongosh` ping command | https://www.mongodb.com/docs/manual/reference/command/ping/ | 2026-05-12 | `db.adminCommand({ping:1})` is the canonical liveness check. Returns `{ok: 1}` even when read-write locked. Used as the compose healthcheck via `mongosh --quiet --eval`. |

## 3. Decisions log

| # | Decision | Chose | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | SMTP catcher | Mailpit (`axllent/mailpit:v1.29`) | Mailhog (`mailhog/mailhog:v1.0.1`) | Mailhog unmaintained since 2024-02-13 (citation 4). Mailpit is a drop-in: same SMTP port, richer Web UI + REST API, 10x smaller container, actively released (v1.29 within last 30 days). Parent plan's "Mailhog" naming is interpreted as the role; the implementation uses Mailpit. |
| D2 | OTEL Collector image | `contrib` (full bundle) | `core` (vanilla receivers/exporters only) | The contrib bundle includes Grafana / Tempo / Loki / Sentry / Prometheus-receiver / kafka-receiver / etc. — all needed at P12+ (notification-service), P15 (insights-service), P21 (observability hardening). Switching from core to contrib later would invalidate every prior local-dev config. ~150 MB image diff is acceptable on a developer host. |
| D3 | Network mode | Bridge (`lotusgift-dev` named network) | Host networking | Host networking saves nothing on Mac/Windows (still virtualised through Docker Desktop's VM). Bridge gives clean container hostnames (`mongo`, `redis`, etc.) for future container-to-container communication when `apps/api-gateway` is dockerised in PR-7. |
| D4 | Volume strategy | Named volumes managed by Docker | Bind mounts to `./.data/` | Named volumes survive `docker compose down` (lose only on `down -v`), have no host-filesystem permission edge cases on Linux, and are properly listed under `docker volume ls`. Bind-mount data dirs leak into `git status` / `pnpm lint`. |
| D5 | Image tag pinning | Floating minor or major (Renovate-managed) | Exact patch | Renovate (shipped in PR-4) opens a PR for every minor bump of `mongo:8.0` / `redis:8-alpine` / `mailpit:v1.29` so the team reviews changes explicitly. Exact-patch pinning would create churn for every weekly patch. OTEL collector is the exception — pinned exact at `0.152.0` because pre-1.0 minor bumps still carry breaking config schema changes. |
| D6 | Mongo major version | 8.0 LTS major | 7.0 LTS major | Atlas M0 currently provisions on 7.0 (verified out-of-band; will be re-verified at P3 `@repo/database` sub-plan). Local-dev uses latest-stable 8.0 to test forward-compat ahead of Atlas's eventual 8.0 rollout. Risk: any Mongo 8-only syntax that fails on Atlas 7 → caught by integration tests at P3+. |
| D7 | Redis major version | 8-alpine | 7-alpine | Redis 8 (GA May 2025) ships built-in vector search useful at P15 (insights-service). Alpine variant chosen for size; full Debian variant only needed if we need glibc-only modules (none today). |
| D8 | OTEL Collector exporter + healthcheck | `debug` (was `logging`); container healthcheck DISABLED (probe externally) | OTLP-to-cloud (Grafana / Tempo); CMD-style healthcheck | Local dev: no cloud destination needed; `debug` prints to stdout. The contrib image v0.103+ is distroless (no `wget`/`curl`/shell), so an in-container healthcheck would always fail. Probe externally via `curl http://localhost:13133/`. P21 swaps `debug` for `otlp` -> Grafana / Tempo / Loki and reintroduces a healthcheck if a non-distroless variant ships. |
| D9 | Mongo replica set | Single standalone | Single-node replica set (`--replSet rs0`) | Standalone is enough for the read/write workload of local dev. P10 (payment-service) needs transactions which require a replica set on production Atlas — local-dev gap captured as an open question (§4 Q4); fix is a one-line `command:` change when the time comes. |
| D10 | Compose file location | `infrastructure/docker/docker-compose.yml` | Repo-root `docker-compose.yml` | Matches the `infrastructure/` directory used in PR-4 for `infrastructure/github/`. Keeps the repo root clean of infra artefacts. |
| D11 | Mailpit message store | In-memory by default | Persistent SQLite via env var | Local dev typically wants fresh mail on every restart; persisting via `MP_DATABASE=/data/mailpit.db` is configurable but not the default. We map a `mailpit-data` volume so users who want persistence flip the env var without breaking compose. |
| D12 | OTEL Collector batch size | Default (200ms timeout, 8192 batch) | Tuned per-pipeline | Local dev sends single requests interactively; defaults are appropriate. Tuning happens at P21 when real traffic shapes are known. |

## 4. Open questions (non-blocking; captured for follow-up)

| # | Question | Owner | Trigger |
| --- | --- | --- | --- |
| Q1 | When do we wire `apps/api-gateway` to consume `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` + `MONGO_URI=mongodb://localhost:27017` + `REDIS_URL=redis://localhost:6379` + `SMTP_URL=smtp://localhost:1025` env vars? | @goldr0g3r | P4 (api-gateway shell sub-plan). |
| Q2 | Atlas Search local emulator (`mongodb-atlas-local`) | @goldr0g3r | P7 (product-service) if developers need to validate `$search` queries before deploying to Atlas. Currently parked: no free-tier emulator and the workflow is small. |
| Q3 | Mongo 8.0 vs 7.0 server-version parity with Atlas M0 | @goldr0g3r | P3 (database package sub-plan). Re-verify Atlas server version + decide whether to downgrade local-dev to 7.0 or wait for Atlas's eventual 8.x rollout. |
| Q4 | Replica-set requirement for local transactions | @goldr0g3r | P10 (payment-service) needs ACID transactions → upgrade local Mongo to a 1-node replica set via `command: [mongod, --replSet, rs0]` + an `init` job. Park until P10. |
| Q5 | `pnpm dev-stack` alias / Justfile | @goldr0g3r | Defer per sub-plan scope decision (minimal). Revisit when raw `docker compose` command becomes a friction point. |
| Q6 | Devcontainer / Codespaces support | @goldr0g3r | Defer until the team grows beyond solo or a contributor explicitly requests it. |
| Q7 | Seed data / index init scripts | @goldr0g3r | Each service that needs indexes registers them in its own `OnModuleInit` (e.g., `services/auth-service` at P5). Local seeding can live in a `pnpm seed` script at P5+. |

## 5. Implementation checklist

- [ ] `docs/research/phase-0-dev-stack.md` committed (this file).
- [ ] `infrastructure/docker/docker-compose.yml` — 4 services + healthchecks + named volumes + bridge network + pinned tags.
- [ ] `infrastructure/docker/otel-collector-config.yaml` — OTLP receivers + batch + debug exporter + health_check extension.
- [ ] `infrastructure/docker/README.md` — quickstart + ports + env-overrides + Mailpit rationale + forward-pointers.
- [ ] Parent plan: `p0-docs` + `p0-ci` → `in_progress` (already done in this branch).
- [ ] Local smoke: `docker compose up -d`, 4 healthchecks, ping each service, `down -v` clean.
- [ ] Repo-wide smoke: `pnpm install`, `pnpm turbo run check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `markdownlint-cli2`, `actionlint`.
- [ ] PR opened with Copilot reviewer + epic #4 + phase-acceptance #5 comments.

## 6. Versions (locked at PR-5 commit time)

| Component | Pin (compose) | Latest stable | Notes |
| --- | --- | --- | --- |
| MongoDB Server | `mongo:8.0` | 8.3.1 (2026-05-06) | Floating major-LTS; Renovate tracks within-major patches. |
| Redis | `redis:8-alpine` | 8.6.3 (2026-05-11) | Floating major; alpine variant. |
| Mailpit | `axllent/mailpit:v1.29` | v1.29.7 (2026-04-16) | Floating minor; Mailhog substitute. |
| OTEL Collector contrib | `otel/opentelemetry-collector-contrib:0.152.0` | 0.152.0 (2026-05-11) | Exact pin (pre-1.0 breaking changes). |
| Docker Compose | v2.x | n/a (Compose Specification) | Repo-root spec; user-installed Docker Desktop or Docker Engine + Compose plugin. |

## 7. Implementation reference

Pending — populated post-merge with PR # + merge SHA + Projects v2 status sync confirmation.
