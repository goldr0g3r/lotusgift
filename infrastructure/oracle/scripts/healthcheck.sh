#!/usr/bin/env bash
#
# LotusGift v2 — public healthcheck probe.
#
# Curls https://${LOTUSGIFT_API_HOST}/healthz with a 5-retry exponential
# back-off (1s, 2s, 4s, 8s, 16s = ~31s total). Used by:
#   - .github/workflows/deploy-oracle.yml `verify` job
#   - Manual operator sanity check post-deploy
#
# Usage:
#   LOTUSGIFT_API_HOST=api.lotusgift.com ./infrastructure/oracle/scripts/healthcheck.sh
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md (heartbeat
# stays local; this is the public probe variant).

set -euo pipefail

: "${LOTUSGIFT_API_HOST:?LOTUSGIFT_API_HOST env var is required}"

URL="https://${LOTUSGIFT_API_HOST}/healthz"
MAX_ATTEMPTS=5

log() {
    printf "\033[1;36m[healthcheck %s]\033[0m %s\n" "$(date --utc +%H:%M:%S)" "$*"
}

for attempt in $(seq 1 "${MAX_ATTEMPTS}"); do
    log "Attempt ${attempt}/${MAX_ATTEMPTS}: GET ${URL}"
    if response=$(curl -fsS --max-time 10 "${URL}" 2>&1); then
        log "OK: ${response}"
        exit 0
    fi
    log "Failed: ${response}"
    if [[ "${attempt}" -lt "${MAX_ATTEMPTS}" ]]; then
        sleep_for=$((2 ** (attempt - 1)))
        log "Sleeping ${sleep_for}s before retry..."
        sleep "${sleep_for}"
    fi
done

log "Healthcheck FAILED after ${MAX_ATTEMPTS} attempts"
exit 1
