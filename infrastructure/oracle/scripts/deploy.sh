#!/usr/bin/env bash
#
# LotusGift v2 — Oracle VM zero-downtime swap script.
#
# Called from the .github/workflows/deploy-oracle.yml `deploy` job over SSH,
# or manually from the runbook Step 7. The first positional arg is the
# desired image tag (typically the merge SHA on main).
#
# Steps:
#   1. Validate inputs + ensure compose file exists
#   2. docker pull <new tag>
#   3. docker compose up -d --wait --wait-timeout 60 api-gateway
#      (compose v2 healthcheck-aware up; old container stays until new healthy)
#   4. Probe /healthz one more time via nginx
#   5. Persist tag to /opt/lotusgift/.last-good-tag (for rollback.sh)
#   6. Prune dangling images (>24h old)
#
# Usage on the VM (run as the deploy user with docker group membership):
#   /opt/lotusgift/scripts/deploy.sh main
#   /opt/lotusgift/scripts/deploy.sh sha-$(git rev-parse HEAD)
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md D5.

set -euo pipefail

TAG="${1:?Tag is required. Usage: deploy.sh <tag> (e.g. main, sha-<hash>, v1.2.3)}"
LOTUSGIFT_HOME="${LOTUSGIFT_HOME:-/opt/lotusgift}"
COMPOSE_FILE="${LOTUSGIFT_HOME}/compose/docker-compose.prod.yml"
LAST_GOOD_FILE="${LOTUSGIFT_HOME}/.last-good-tag"
HEALTHZ_URL="${HEALTHZ_URL:-http://127.0.0.1:3001/healthz}"

log() {
    printf "\033[1;32m[deploy %s]\033[0m %s\n" "$(date --utc +%H:%M:%S)" "$*"
}

[[ -f "${COMPOSE_FILE}" ]] || {
    printf "compose file missing at %s\n" "${COMPOSE_FILE}" >&2
    exit 1
}

cd "${LOTUSGIFT_HOME}/compose"

log "Pulling ghcr.io/.../lotusgift-api:${TAG}..."
IMAGE_TAG="${TAG}" docker compose -f docker-compose.prod.yml pull api-gateway

log "Recreating api-gateway with new tag (healthcheck-gated, 60s wait)..."
IMAGE_TAG="${TAG}" docker compose -f docker-compose.prod.yml up -d \
    --wait \
    --wait-timeout 60 \
    --no-deps \
    api-gateway

log "Probing ${HEALTHZ_URL}..."
for i in 1 2 3 4 5; do
    if curl -fsS --max-time 5 "${HEALTHZ_URL}" >/dev/null; then
        log "healthz OK on attempt ${i}"
        break
    fi
    if [[ "${i}" -eq 5 ]]; then
        log "healthz FAILED after 5 attempts — invoke rollback.sh"
        exit 2
    fi
    sleep $((i * 2))
done

# Persist tag so rollback.sh + the systemd unit have a known-good target.
echo "${TAG}" > "${LAST_GOOD_FILE}"
echo "IMAGE_TAG=${TAG}" > "${LOTUSGIFT_HOME}/.image-tag.env"
log "Persisted last-good tag to ${LAST_GOOD_FILE}"

# Image hygiene — remove dangling layers older than 24h (saves ~1 GB / week).
log "Pruning dangling images >24h old..."
docker image prune -f --filter "until=24h" || true

log "Deploy complete: ${TAG}"
