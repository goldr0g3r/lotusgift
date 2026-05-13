#!/usr/bin/env bash
#
# LotusGift v2 — Oracle VM rollback to the last-known-good tag.
#
# Re-runs deploy.sh with the tag persisted in /opt/lotusgift/.last-good-tag
# by the most recent successful deploy.
#
# Usage on the VM:
#   /opt/lotusgift/scripts/rollback.sh
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md D5.

set -euo pipefail

LOTUSGIFT_HOME="${LOTUSGIFT_HOME:-/opt/lotusgift}"
LAST_GOOD_FILE="${LOTUSGIFT_HOME}/.last-good-tag"

log() {
    printf "\033[1;33m[rollback %s]\033[0m %s\n" "$(date --utc +%H:%M:%S)" "$*"
}

if [[ ! -s "${LAST_GOOD_FILE}" ]]; then
    log "No last-good tag found at ${LAST_GOOD_FILE} — pass a tag manually:"
    log "  /opt/lotusgift/scripts/deploy.sh <tag>"
    exit 1
fi

PREVIOUS_TAG=$(< "${LAST_GOOD_FILE}")
log "Rolling back to ${PREVIOUS_TAG}..."
exec "${LOTUSGIFT_HOME}/scripts/deploy.sh" "${PREVIOUS_TAG}"
