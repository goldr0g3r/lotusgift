# Local development runbook

> Get a LotusGift v2 contributor productive on a fresh machine in ~15 minutes. The team default is host-installed MongoDB + Redis; the docker compose stack at [`infrastructure/docker/docker-compose.yml`](../../infrastructure/docker/docker-compose.yml) stays as a fallback.

Prerequisites: a workstation running Ubuntu 24.04 LTS, macOS 14+, or Windows 11 (with WSL2 if you choose the Docker fallback). Node 22+ LTS, pnpm 9+, git 2.40+, and (recommended) the GitHub CLI `gh`.

---

## 1. Why we prefer the host install

| Property | Host install (apt/brew/winget) | Docker compose fallback |
| --- | --- | --- |
| Cold start time | 0s (already running) | 20-40s on first pull |
| RAM idle cost | ~80 MB | ~600 MB (Docker Desktop) |
| OS package manager handles updates | yes | manual `docker compose pull` |
| Survives reboot without manual `up` | yes (systemd / launchd) | depends on Docker Desktop "start at boot" |
| Matches what most contributors already have | yes | requires Docker Desktop license + Windows WSL2 |
| Connection string identical to prod local-mode | yes (`localhost:27017` / `localhost:6379`) | yes |
| Multi-version testing | apt holds + brew unlink | trivial with compose tag pinning |

Picking the host path is the default. The `docker compose` fallback exists for contributors on locked-down corporate machines, fresh laptops where installing the database server feels heavy, or anyone reproducing a CI-like clean-room.

> **Operational invariant.** Both paths bind on the same default ports (`27017` for Mongo, `6379` for Redis). All app `.env.development` files use `mongodb://localhost:27017/lotusgift` + `redis://localhost:6379` so the only difference between host and docker is **which process answers on those ports**.

---

## 2. Install MongoDB Community 8.0 + Redis 8

### Ubuntu 24.04 LTS (Noble)

MongoDB 8.0 via the official apt repo (per [MongoDB docs, 2026-05-14](https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-ubuntu/)):

```bash
sudo apt-get install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-8.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
    sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```

Redis 8 via the official apt repo (per [Redis docs, 2026-05-14](https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/apt/)):

```bash
curl -fsSL https://packages.redis.io/gpg | \
    sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | \
    sudo tee /etc/apt/sources.list.d/redis.list
sudo apt-get update
sudo apt-get install -y redis
sudo systemctl enable --now redis-server
```

### macOS (Homebrew)

```bash
brew tap mongodb/brew
brew install mongodb-community@8.0
brew services start mongodb-community@8.0

brew install redis
brew services start redis
```

### Windows (winget + WSL2 OR Memurai)

The lazy path: install Ubuntu 24.04 via WSL2 and follow the Linux instructions above.

The native path:

```powershell
winget install MongoDB.Server
winget install Memurai.MemuraiDeveloper   # Redis-compatible for Windows, per redis.io
```

> **Authentication note.** All three platforms ship Mongo + Redis with authentication OFF on `localhost`. That's fine for dev — never expose these ports outside `127.0.0.1`. Bind addresses are baked into `/etc/mongod.conf` (Ubuntu), `~/Library/LaunchAgents/homebrew.mxcl.mongodb-community@8.0.plist` (macOS), or the Windows service config.

---

## 3. Validate the install

Each platform answers identically:

```bash
mongosh "mongodb://localhost:27017" --eval "db.adminCommand({ ping: 1 })"
# { ok: 1 }

redis-cli -h localhost -p 6379 ping
# PONG
```

If either ping fails, see [Section 7 — Troubleshooting](#7-troubleshooting).

---

## 4. Connection strings + env vars

Drop these into your app-specific `.env.development` files (none exist yet pre-P4; this table is the contract for when they appear). The strings are identical regardless of whether Mongo + Redis came from the host install or the docker compose fallback:

| Var | Value | Consumed at |
| --- | --- | --- |
| `MONGO_URI` | `mongodb://localhost:27017/lotusgift` | P3 (`@repo/database`) |
| `REDIS_URL` | `redis://localhost:6379` | P3 (`@repo/utils`) |
| `SMTP_URL` | `smtp://localhost:1025` | P12 (`notification-service`); compose-only — see Section 5 |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318` | P21 (observability); compose-only — see Section 5 |
| `BETTER_AUTH_URL` | `http://localhost:3001` | P5 (`auth-service`) |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` output | P5; generate per-dev locally |

The full per-env-var list (with `# provenance: P<N>` comments) lives at [`infrastructure/oracle/.env.production.example`](../../infrastructure/oracle/.env.production.example).

---

## 5. Docker compose fallback

If you prefer not to install Mongo + Redis on the host (corporate-locked machine, ephemeral CI-like setup, or you want Mailpit + OTEL Collector locally without standing them up by hand):

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
docker compose -f infrastructure/docker/docker-compose.yml ps   # all services Up (healthy)
```

The compose stack runs:

- `mongo:8.0` on `:27017` — same port as the host install (start one or the other, not both)
- `redis:8-alpine` on `:6379` — ditto
- `axllent/mailpit:v1.29` on `:1025` (SMTP) + `:8025` (UI) — not provided by the host path
- `otel/opentelemetry-collector-contrib:0.152.0` on `:4317` + `:4318` — not provided by the host path

Full reference + port-override env vars: [`infrastructure/docker/README.md`](../../infrastructure/docker/README.md).

> **Mutual exclusion.** Running BOTH the host services AND the compose stack at the same time will fail on port-bind (`address already in use`). Stop one before starting the other:
>
> - Host: `sudo systemctl stop mongod redis-server` (Ubuntu); `brew services stop mongodb-community@8.0 redis` (macOS).
> - Compose: `docker compose -f infrastructure/docker/docker-compose.yml down`.

---

## 6. Decision matrix: which path for which contributor?

| You are... | Use |
| --- | --- |
| A regular contributor on Linux or macOS without an existing Mongo/Redis install | Host install (Section 2) |
| Already running Mongo / Redis for another project | Host install (port-share via Mongo databases / Redis SELECT) |
| On a Windows machine without WSL2 | Docker compose (Section 5) OR install Memurai + MongoDB Server natively |
| On a corporate-locked Mac that blocks Homebrew | Docker compose (Section 5) |
| Reproducing a CI failure that touches Mailpit or the OTEL Collector | Docker compose (Section 5) — you need those services |
| Writing P12 `notification-service` code | Docker compose (you need Mailpit) |
| Writing P21 observability wiring | Docker compose (you need the OTEL Collector) |
| Doing a clean-room "does my PR work for a new contributor?" check | Docker compose (Section 5) |
| Anywhere else | Host install |

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `mongosh: command not found` | Mongo Shell installed separately from server | Ubuntu: `sudo apt-get install -y mongodb-mongosh`. macOS: `brew install mongosh`. Windows: `winget install MongoDB.Shell`. |
| `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017` | mongod not running | Ubuntu: `sudo systemctl status mongod` → `start` if dead. macOS: `brew services list` → `start mongodb-community@8.0`. |
| `Could not connect to Redis at 127.0.0.1:6379: Connection refused` | redis-server not running | Same as above for the redis service. |
| `bind: address already in use` | Both host + compose competing for `:27017` or `:6379` | Stop one (Section 5 callout). |
| `MongoDB 8.0 requires AVX support` on host install | Pre-2011 Intel CPU | Pin to `mongodb-org=7.0.*` (apt) OR switch to docker compose with `image: mongo:7.0`. |
| Memurai on Windows missing some Redis 8 commands | Memurai targets the Redis API surface but lags by a release | Switch to WSL2 + apt-installed redis. |
| Slow `mongod` startup on macOS after Sonoma upgrade | Spotlight indexing `/usr/local/var/mongodb` | `sudo mdutil -i off /usr/local/var/mongodb`. |
| Want to wipe local data | Drop the Mongo DB or flush Redis | `mongosh "mongodb://localhost:27017/lotusgift" --eval "db.dropDatabase()"`; `redis-cli FLUSHALL`. |

---

## 8. Forward pointers

- [`infrastructure/docker/README.md`](../../infrastructure/docker/README.md) — full docker compose reference, including Mailpit + OTEL Collector + port-override env vars.
- [`docs/runbooks/backup-restore.md`](backup-restore.md) — how the production Mongo + Redis get backed up (different topic; localhost dev data is throwaway).
- [`docs/runbooks/oracle-deploy.md`](oracle-deploy.md) — how the api-gateway connects to production Atlas + Upstash (different connection strings; same env var names).
- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — P3 (`@repo/database`) is where these env vars first get read by app code.
