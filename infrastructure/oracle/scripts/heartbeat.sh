#!/usr/bin/env bash
#
# LotusGift v2 — Oracle Always Free idle-reclaim heartbeat.
#
# Generates ~10s of controlled CPU activity + a localhost curl every time it
# runs (every 6h via lotusgift-heartbeat.timer). This keeps the 95th-
# percentile CPU + network sample above Oracle's 20%-for-7-days reclaim
# threshold without burning meaningful resources.
#
# Logs to:
#   - systemd journal (via the service unit's StandardOutput=journal)
#   - /var/log/lotusgift/heartbeat.log (rotated by logrotate snippet)
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md D6 + D7.

set -euo pipefail

LOG_DIR=/var/log/lotusgift
LOG_FILE="${LOG_DIR}/heartbeat.log"
BURST_SECS="${HEARTBEAT_BURST_SECS:-10}"
HEALTHZ_URL="${HEARTBEAT_HEALTHZ_URL:-http://127.0.0.1:3001/healthz}"

mkdir -p "${LOG_DIR}"

ts() {
    date --utc +"%Y-%m-%dT%H:%M:%SZ"
}

log() {
    printf "%s %s\n" "$(ts)" "$*" | tee -a "${LOG_FILE}"
}

log "heartbeat: start (burst=${BURST_SECS}s; probe=${HEALTHZ_URL})"

# Controlled CPU burst — `yes` is the canonical low-impact-but-measurable
# workload (writes 'y\n' as fast as one core can to /dev/null).
yes > /dev/null & BURST_PID=$!
sleep "${BURST_SECS}"
kill "${BURST_PID}" 2>/dev/null || true
wait "${BURST_PID}" 2>/dev/null || true

# Localhost probe — exercises the api-gateway end-to-end (Docker network +
# Node loop + Nest controller). Failure is non-fatal: heartbeat continues
# so the CPU-side of the mitigation still applies even when the API is
# being redeployed.
if HEALTHZ_RESPONSE=$(curl -fsS --max-time 5 "${HEALTHZ_URL}" 2>&1); then
    log "healthz: ok response=${HEALTHZ_RESPONSE}"
else
    log "healthz: FAIL (${HEALTHZ_RESPONSE}) — continuing"
fi

log "heartbeat: end"
