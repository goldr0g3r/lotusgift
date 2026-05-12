# Local development stack

Spin up Mongo, Redis, Mailpit (modern Mailhog replacement) and an OpenTelemetry Collector with a single `docker compose` command. Used by `apps/api-gateway` (from P4 onwards) and every Nest service library so contributors can run the full backend stack without provisioning anything cloud-side.

Pinning rationale + Mailhog -> Mailpit substitution decisions are captured in [`docs/research/phase-0-dev-stack.md`](../../docs/research/phase-0-dev-stack.md). The production stack (Oracle A1.Flex + nginx + Certbot) lives in `infrastructure/oracle/docker-compose.prod.yml` and ships in PR-7.

## Prerequisites

- **Docker Desktop 4.30+** (Mac / Windows) or **Docker Engine 24+** with the Compose v2 plugin (Linux).
- ~3 GB free disk for first-pull images.
- Mongo 8 requires AVX support on the host CPU. If you are on a pre-2011 Intel chip without AVX, downgrade to `mongo:7.0` by editing [`docker-compose.yml`](docker-compose.yml).

Verify with:

```bash
docker --version          # >= 24.x
docker compose version    # v2.x
```

## Quickstart

```bash
# From the repo root.
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Wait ~30s on first run (image pulls), <10s on subsequent runs.
# `mongo`, `redis`, `mailpit` will report `Up (healthy)`.
# `otel-collector` reports `Up` WITHOUT a `(healthy)` annotation by design —
# its image is distroless and has no in-container probe binary; verify it
# externally via `curl -fsS http://localhost:13133/`.
docker compose -f infrastructure/docker/docker-compose.yml ps

# Tear down (preserves volumes).
docker compose -f infrastructure/docker/docker-compose.yml down

# Reset (drops all data).
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

A `pnpm dev-stack` alias is intentionally **not** provided in PR-5 (scope decision: minimal). Add one in a follow-up PR if friction emerges.

## Services + ports

| Service | Image (pinned) | Host port (default) | Container port | Purpose |
| --- | --- | --- | --- | --- |
| `mongo` | `mongo:8.0` | 27017 | 27017 | Primary database (MongoDB 8.0 LTS). |
| `redis` | `redis:8-alpine` | 6379 | 6379 | Sessions, rate-limit counters, idempotency keys, RFQ-router cache. |
| `mailpit` SMTP | `axllent/mailpit:v1.29` | 1025 | 1025 | SMTP catcher for outbound mail from `notification-service` (P12+). |
| `mailpit` Web UI | (same image) | 8025 | 8025 | Inbox / search / API at `http://localhost:8025`. |
| `otel-collector` OTLP gRPC | `otel/opentelemetry-collector-contrib:0.152.0` | 4317 | 4317 | OTLP gRPC from `api-gateway` + service libraries. |
| `otel-collector` OTLP HTTP | (same image) | 4318 | 4318 | OTLP HTTP (`/v1/traces`, `/v1/metrics`, `/v1/logs`). |
| `otel-collector` metrics | (same image) | 8888 | 8888 | Prometheus-scrape endpoint exposing the collector's own metrics. |
| `otel-collector` health | (same image) | 13133 | 13133 | Health-check extension; returns 200 if all pipelines healthy. |

All host ports are overridable via env vars (see [Port-conflict workaround](#port-conflict-workaround)).

## Connection strings (default ports)

For `apps/api-gateway` `.env.development` (consumed at P4):

```env
MONGO_URI=mongodb://localhost:27017/lotusgift
REDIS_URL=redis://localhost:6379
SMTP_URL=smtp://localhost:1025
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_SERVICE_NAME=lotusgift-api-gateway
```

For container-to-container connections (when `apps/api-gateway` is itself running in compose, post-PR-7), substitute the service names: `mongodb://mongo:27017/lotusgift`, `redis://redis:6379`, `smtp://mailpit:1025`, `http://otel-collector:4318`.

## Operational recipes

### Inspect healthchecks

```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
# STATUS column shows: Up (healthy) | Up (starting) | Up (unhealthy)

# Detailed JSON state for one service.
docker inspect --format='{{json .State.Health}}' lotusgift-mongo | jq
```

### Tail logs

```bash
# All services.
docker compose -f infrastructure/docker/docker-compose.yml logs -f

# One service (OTEL collector pretty-prints incoming OTLP traces here).
docker compose -f infrastructure/docker/docker-compose.yml logs -f otel-collector
```

### Functional pings

Commands below assume the **default ports**. If you overrode any port via env vars (see [Port-conflict workaround](#port-conflict-workaround)), substitute accordingly — for example `redis-cli -h localhost -p 6380 ping` after `REDIS_PORT=6380`.

```bash
mongosh mongodb://localhost:27017 --eval "db.adminCommand({ ping: 1 })"
redis-cli -h localhost -p 6379 ping
curl -sf http://localhost:8025/api/v1/info | jq
curl -sf http://localhost:13133/
```

### Drop into the Mailpit Web UI

Open `http://localhost:8025` in a browser. SMTP messages sent to `localhost:1025` show up immediately. API docs at `http://localhost:8025/api/v1/`.

### Port-conflict workaround

If your host already runs Mongo, Redis, or anything on the listed ports, override per service via env vars:

```bash
MONGO_PORT=27018 REDIS_PORT=6380 MAILPIT_UI_PORT=18025 \
  docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Full env-var list:

| Var | Default | Service | Container port |
| --- | --- | --- | --- |
| `MONGO_PORT` | 27017 | mongo | 27017 |
| `REDIS_PORT` | 6379 | redis | 6379 |
| `MAILPIT_SMTP_PORT` | 1025 | mailpit | 1025 |
| `MAILPIT_UI_PORT` | 8025 | mailpit | 8025 |
| `OTEL_GRPC_PORT` | 4317 | otel-collector | 4317 |
| `OTEL_HTTP_PORT` | 4318 | otel-collector | 4318 |
| `OTEL_METRICS_PORT` | 8888 | otel-collector | 8888 |
| `OTEL_HEALTH_PORT` | 13133 | otel-collector | 13133 |

Container-to-container traffic is unaffected — the values above only change host-side bindings.

## Mailhog -> Mailpit substitution

The parent plan names "Mailhog" but Mailhog's repo at `mailhog/MailHog` has been effectively unmaintained since `2024-02-13` (last push). Mailpit (`axllent/mailpit`) is the community-recognised successor: same SMTP-catcher role, a richer Web UI + REST API, ~10x smaller container, weekly releases. We treat "Mailhog" in the parent plan as the role, not the implementation. Decision captured in [`docs/research/phase-0-dev-stack.md`](../../docs/research/phase-0-dev-stack.md) D1.

## Out of scope (deferred to later PRs)

- `.devcontainer/devcontainer.json` for Codespaces — deferred until contributor demand emerges.
- Seed scripts / index init — each service that needs indexes registers them in its own module `OnModuleInit` (P5+). Local seed CLI is a P5+ concern.
- Production-grade compose (`docker-compose.prod.yml` + nginx + Certbot + UFW + fail2ban) — that is PR-7 (`p0-oracle-runbook`).
- Atlas Search local emulator (`mongodb/atlas-local`) — not part of the free-tier dev experience; revisit at P7 if `$search` queries become painful to validate.
- Sentry / Loki / Tempo / Jaeger local containers — observability hardening lives at P21.
- Single-node Mongo replica set for ACID transactions — needed at P10 (`payment-service`); flip `mongo` service to `command: [mongod, --replSet, rs0]` + one-shot init.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `mongo` exits with `MongoDB 8.0 requires AVX support` | Pre-AVX CPU (~pre-2011 Intel). | Edit [`docker-compose.yml`](docker-compose.yml) to use `mongo:7.0`. |
| `bind: address already in use` on port 27017 / 6379 / 1025 / 8025 | Host port collision. | Override with `MONGO_PORT=…` etc., see [Port-conflict workaround](#port-conflict-workaround). |
| `mailpit` healthcheck flapping unhealthy | Container was just started; wait the 5s `start_period`. | `docker compose logs -f mailpit` — typically resolves in 10s. |
| `otel-collector` exits with `failed to parse config` | YAML schema drift from v0.86 (e.g., renamed `logging` exporter -> `debug`). | We pin to `0.152.0`; if the bundled config drifts in future, regenerate from [`docs/research/phase-0-dev-stack.md`](../../docs/research/phase-0-dev-stack.md) citation 6. |
| `otel-collector` status shows nothing (no `(healthy)` annotation) | OTEL contrib image is distroless from v0.103+; in-container healthcheck disabled (no `wget`/`curl` to probe with). | Probe externally: `curl -fsS http://localhost:13133/` — should return `{"status":"Server available", ...}`. Decision captured in `docs/research/phase-0-dev-stack.md` D8. |
| `docker compose ps` says `Up (unhealthy)` for a service | Healthcheck timing out. | `docker inspect --format='{{json .State.Health}}' lotusgift-<service>` to see the last 5 probe outputs. |

## Forward pointers

- **P4** (`apps/api-gateway` shell) consumes these endpoints via env vars in its `.env.development`.
- **P5** (`services/auth-service`) connects to `mongo` + `redis`.
- **P12** (`services/notification-service`) sends SMTP to `mailpit`.
- **P21** (observability hardening) swaps the OTEL `debug` exporter for `otlp` -> Grafana Cloud / Tempo / Loki.
- **PR-7** (`p0-oracle-runbook`) ships the production compose stack at `infrastructure/oracle/docker-compose.prod.yml`.
