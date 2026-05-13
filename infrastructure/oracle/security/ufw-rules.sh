#!/usr/bin/env bash
#
# LotusGift v2 — UFW baseline rules.
#
# Idempotent: rerunning is safe (ufw reset clears the rules first; ufw
# enable + default + allow are all no-ops when already in the desired state).
#
# Usage:
#   sudo ./infrastructure/oracle/security/ufw-rules.sh
#
# Decisions captured in docs/research/phase-0-oracle-runbook.md D14.

set -euo pipefail

log() {
    printf "\033[1;32m[ufw-rules]\033[0m %s\n" "$*"
}

if ! command -v ufw >/dev/null 2>&1; then
    log "Installing ufw..."
    apt-get update
    apt-get install -y ufw
fi

# Enable IPv6 (Oracle A1.Flex gets a /128 by default).
sed -i 's/^IPV6=.*/IPV6=yes/' /etc/default/ufw

# Default-deny incoming, default-allow outgoing.
log "Setting default policies..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# OpenSSH on :22 with brute-force rate-limit (UFW does 6 conns / 30s by
# default for `limit`).
log "Allowing SSH (rate-limited)..."
ufw limit 22/tcp comment 'SSH (rate-limited)'

# HTTP for Certbot ACME challenge + the :80 -> :443 redirect.
log "Allowing HTTP..."
ufw allow 80/tcp comment 'HTTP (ACME + redirect)'

# HTTPS for the api-gateway reverse proxy.
log "Allowing HTTPS..."
ufw allow 443/tcp comment 'HTTPS (api.lotusgift.com)'

# Logging on for fail2ban + audit.
ufw logging on

# Enable + verify.
log "Enabling ufw..."
ufw --force enable
ufw status verbose | tee /var/log/ufw-status-applied.log
