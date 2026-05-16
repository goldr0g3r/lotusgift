# syntax=docker/dockerfile:1.7
#
# LotusGift v2 — api-gateway production image.
#
# Multi-stage build emitting a ~120 MB linux/amd64 + linux/arm64 manifest.
# Push target: ghcr.io/goldr0g3r/lotusgift-api:<tag>
# Runtime target: Oracle A1.Flex (ARM) behind nginx + Certbot
#                 (see infrastructure/oracle/ + docs/runbooks/oracle-deploy.md).
#
# Stages:
#   1. deps    — pnpm fetch + workspace install (all dependencies, cached on lockfile)
#   2. build   — pnpm turbo run build (compiles NestJS to dist/)
#   3. runtime — node:22-alpine + dumb-init PID 1 + non-root nestjs user + dist/
#
# Notes:
#   - Pinned versions: node 22 LTS on alpine 3.21; pnpm 9.0.0 (matches root package.json
#     packageManager field); turbo 2.x (matches root devDependencies).
#   - Multi-arch build is wired in .github/workflows/deploy-oracle.yml via
#     docker/setup-qemu-action@v3 + docker/setup-buildx-action@v3 + platforms:
#     linux/amd64,linux/arm64.
#   - HEALTHCHECK probes the /healthz endpoint added in apps/api-gateway/src/health/.
#     The /readyz endpoint that exercises downstream dependencies (Mongo / Redis)
#     lands at P4.
#
# Build locally:
#   docker build -f apps/api-gateway/Dockerfile -t lotusgift-api:test .
# Run locally:
#   docker run --rm -p 3001:3001 lotusgift-api:test
#   curl -fsS http://localhost:3001/healthz | jq

# ----------------------------------------------------------------------------
# Stage 1: deps — install every workspace's dependencies (cached by lockfile).
# ----------------------------------------------------------------------------
FROM node:22-alpine AS deps

# corepack ships with node 22, but isn't always enabled in the base image.
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /workspace

# Copy the bare minimum needed to resolve the workspace graph + fetch deps.
# pnpm-lock.yaml + every package.json is required for the workspace resolver.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api-gateway/package.json ./apps/api-gateway/
COPY packages/analytics-sdk/package.json ./packages/analytics-sdk/
COPY packages/api/package.json ./packages/api/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/events/package.json ./packages/events/
COPY packages/jest-config/package.json ./packages/jest-config/
COPY packages/observability/package.json ./packages/observability/
COPY packages/openapi-spec/package.json ./packages/openapi-spec/
COPY packages/prettier-config/package.json ./packages/prettier-config/
COPY packages/types/package.json ./packages/types/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/utils/package.json ./packages/utils/
COPY packages/validators/package.json ./packages/validators/
COPY services/auth-service/package.json ./services/auth-service/
COPY services/product-service/package.json ./services/product-service/
COPY services/vendor-service/package.json ./services/vendor-service/

# Frozen-lockfile install across the workspace so every transitive dep is
# resolved exactly as committed. Cache-mount keeps the pnpm store warm across
# rebuilds without baking it into the image.
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @lotusgift/api-gateway... --filter @repo/api...

# ----------------------------------------------------------------------------
# Stage 2: build — compile TypeScript to dist/ via turbo.
# ----------------------------------------------------------------------------
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /workspace

# Pull node_modules + the workspace metadata from deps.
COPY --from=deps /workspace ./

# Bring in the source we actually compile.
COPY apps/api-gateway ./apps/api-gateway
COPY packages/analytics-sdk ./packages/analytics-sdk
COPY packages/api ./packages/api
COPY packages/config ./packages/config
COPY packages/database ./packages/database
COPY packages/eslint-config ./packages/eslint-config
COPY packages/events ./packages/events
COPY packages/jest-config ./packages/jest-config
COPY packages/observability ./packages/observability
COPY packages/openapi-spec ./packages/openapi-spec
COPY packages/prettier-config ./packages/prettier-config
COPY packages/types ./packages/types
COPY packages/typescript-config ./packages/typescript-config
COPY packages/utils ./packages/utils
COPY packages/validators ./packages/validators
COPY services/auth-service ./services/auth-service
COPY services/product-service ./services/product-service
COPY services/vendor-service ./services/vendor-service

# Run turbo build for the api-gateway and its dependency graph.
# Output: apps/api-gateway/dist/*.
RUN --mount=type=cache,id=turbo,target=/workspace/.turbo \
    pnpm turbo run build --filter=@lotusgift/api-gateway

# Prune to production-only dependencies for the runtime stage.
# pnpm --prod prunes devDependencies in place from the existing node_modules.
RUN pnpm --filter @lotusgift/api-gateway --prod deploy /pruned

# ----------------------------------------------------------------------------
# Stage 3: runtime — minimal image with dist + production node_modules only.
# ----------------------------------------------------------------------------
FROM node:22-alpine AS runtime

# dumb-init forwards SIGTERM/SIGINT to the Node process (Node doesn't handle
# PID 1 signals reliably).
# wget is needed by the HEALTHCHECK probe.
RUN apk add --no-cache dumb-init wget \
 && addgroup -S nestjs \
 && adduser -S nestjs -G nestjs -u 1001

WORKDIR /opt/api-gateway

# Copy pruned workspace (dist + node_modules + package.json).
COPY --from=build --chown=nestjs:nestjs /pruned ./

USER nestjs

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

# 30s start grace, then a probe every 30s; mark unhealthy after 3 failures.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:3001/healthz >/dev/null 2>&1 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
