# Local dev setup

**Audience**: new contributors (humans + coding agents)
**Phase**: P0 onward (full `pnpm dev` useful from P5)
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

End-to-end: clone → run. Roughly 15 minutes once prerequisites are in place.

## 1. Clone

```powershell
cd C:\Code
git clone https://github.com/goldr0g3r/lotusgift.git
cd lotusgift
```

> **Tip — Windows path length**: keep the repo near a drive root (`C:\Code\lotusgift` is fine) or enable long paths per [`prerequisites.md`](./prerequisites.md).

## 2. Verify Node + pnpm

```powershell
node --version   # → v20.x.x+
pnpm --version   # → 9.x.x (matches packageManager in package.json)
```

If pnpm isn't available:
```powershell
corepack enable
corepack prepare pnpm@9.0.0 --activate
```

## 3. Install dependencies

```powershell
pnpm install
```

What happens:
- Reads the workspace catalog in `pnpm-workspace.yaml`
- Resolves the dep graph for `apps/`, `services/`, `packages/`
- Writes `node_modules/.pnpm/` content-addressed store

Completes in ~60 seconds on a warm cache.

## 4. Copy `.env.example` → `.env`

```powershell
Copy-Item .env.example .env
```

The `.env.example` has all variable names with empty values. For local dev, minimum required:

```ini
# MongoDB (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/lotusgift

# Redis (local or Upstash)
REDIS_URL=redis://localhost:6379

# Better-Auth
BETTER_AUTH_SECRET=dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3001

# Razorpay (test mode)
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

See `packages/config/src/env.schema.ts` for the full Zod-validated schema.

## 5. Start local services

### Option A: Docker Compose (recommended)

```powershell
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

Starts MongoDB 8 + Redis 7. Ports: `27017` (Mongo), `6379` (Redis).

### Option B: Host-installed

- MongoDB Community Server running on `localhost:27017`
- Redis (Memurai on Windows) running on `localhost:6379`

## 6. Dev server

```powershell
pnpm dev
```

Turborepo orchestrates:
- `apps/api-gateway` → `http://localhost:3001` (NestJS)
- `apps/web-customer` → `http://localhost:3000` (Next.js)
- `apps/web-vendor` → `http://localhost:3002` (Next.js)
- `apps/web-admin` → `http://localhost:3003` (Next.js)
- `apps/web-customer-service` → `http://localhost:3004` (Next.js)

## 7. Verify

```powershell
# API gateway health
curl http://localhost:3001/health
# → {"status":"ok"}

# Web customer
curl -s http://localhost:3000 | Select-String "<title>"
```

## Common commands

| Action | Command |
| ------ | ------- |
| Dev (all) | `pnpm dev` |
| Build | `pnpm build` |
| Lint | `pnpm lint` |
| Format check | `pnpm format` |
| Type check | `pnpm typecheck` |
| Test (unit) | `pnpm test` |
| Test (e2e) | `pnpm test:e2e` |
| OpenAPI check | `pnpm openapi:check` |
| Kubb regenerate | `pnpm api:generate` |
| Dep-cruiser | `pnpm dep-cruiser` |

## Next step

→ [`ide-setup.md`](./ide-setup.md)
