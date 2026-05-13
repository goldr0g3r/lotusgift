#!/usr/bin/env bash
#
# LotusGift v2 — Certbot first-issuance + renewal-hook bootstrap.
#
# Idempotent: rerunning the script is safe (snap install is a no-op when
# already installed; certbot certonly --keep-until-expiring won't re-issue
# inside the renewal window).
#
# Prereqs (all installed by the runbook's Section 2 before this script runs):
#   - Ubuntu 24.04 LTS with snapd
#   - nginx 1.27.x serving the LotusGift vhost on :80 (so HTTP-01 can resolve)
#   - DNS A/AAAA records for ${LOTUSGIFT_API_HOST} pointing at the VM
#   - UFW allowing 80/tcp + 443/tcp inbound
#
# Usage:
#   sudo LOTUSGIFT_API_HOST=api.lotusgift.com \
#        LOTUSGIFT_ACME_EMAIL=ops@lotusgift.com \
#        ./infrastructure/oracle/scripts/certbot-bootstrap.sh
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md D2.

set -euo pipefail

: "${LOTUSGIFT_API_HOST:?LOTUSGIFT_API_HOST env var is required, e.g. api.lotusgift.com}"
: "${LOTUSGIFT_ACME_EMAIL:?LOTUSGIFT_ACME_EMAIL env var is required for LE expiry notices}"

WEBROOT=/var/www/letsencrypt

log() {
    printf "\033[1;32m[certbot-bootstrap]\033[0m %s\n" "$*"
}

# Step 1 — Install certbot via snap (Let's Encrypt's recommended path 2026).
if ! command -v snap >/dev/null 2>&1; then
    log "snap not installed; installing snapd..."
    apt-get update
    apt-get install -y snapd
    snap install core
    snap refresh core
fi

if ! snap list certbot >/dev/null 2>&1; then
    log "Installing certbot snap (classic confinement)..."
    snap install --classic certbot
fi

# Symlink certbot into PATH if missing.
if [[ ! -L /usr/local/bin/certbot ]]; then
    ln -sf /snap/bin/certbot /usr/local/bin/certbot
fi

# Step 2 — Webroot dir for ACME challenges (matches nginx snippet path).
mkdir -p "${WEBROOT}/.well-known/acme-challenge"
chown -R www-data:www-data "${WEBROOT}"

# Step 3 — Request the cert via webroot.
# --keep-until-expiring is the no-op-when-valid flag, making the script
# rerun-safe.
log "Requesting cert for ${LOTUSGIFT_API_HOST}..."
certbot certonly \
    --non-interactive \
    --agree-tos \
    --email "${LOTUSGIFT_ACME_EMAIL}" \
    --webroot \
    --webroot-path "${WEBROOT}" \
    --keep-until-expiring \
    --deploy-hook 'systemctl reload nginx' \
    -d "${LOTUSGIFT_API_HOST}"

# Step 4 — Confirm the renewal timer is active. Snap installs
# snap.certbot.renew.timer automatically, running twice daily at random
# minutes — no cron entry needed.
log "Verifying renewal timer..."
systemctl list-timers snap.certbot.renew.timer --no-pager || true

log "Done. Cert path: /etc/letsencrypt/live/${LOTUSGIFT_API_HOST}/fullchain.pem"
log "Dry-run renewal: sudo certbot renew --dry-run"
