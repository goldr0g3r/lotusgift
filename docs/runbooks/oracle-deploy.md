# Oracle deploy runbook

> One-shot bootstrap for a fresh LotusGift v2 Oracle Cloud A1.Flex VM hosting `api.lotusgift.com`. Run sections 1-8 in order. Total wall-clock: ~60 minutes.

This runbook captures every manual + scripted step that takes an empty Oracle Cloud Always Free tenancy from zero to a green `https://api.lotusgift.com/healthz` answer, with auto-deploy on every `main` push.

Prerequisites: an Oracle Cloud Free Tier tenancy in the **Mumbai (`ap-mumbai-1`)** region, a registered domain (we use `lotusgift.com`), access to its DNS provider (we use Cloudflare DNS-only mode for PR-7 — see [research note Q2](../research/phase-0-oracle-runbook.md#3-open-questions)), repo admin access to `goldr0g3r/lotusgift`, an SSH key pair on your workstation, and ~60 minutes.

Pair this runbook with [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md) for the file-tree map + audit-drift commands.

---

## Step 1 — Provision the Oracle A1.Flex VM (Mumbai) (≈10 min)

Oracle Always Free tenancies in Mumbai get up to **4 OCPUs + 24 GB RAM** of `VM.Standard.A1.Flex` (ARM Ampere). One VM is enough for the LotusGift v2 modular monolith.

1. Sign in at <https://cloud.oracle.com> and switch to `Mumbai (ap-mumbai-1)` (top-right region picker).
2. Menu → **Compute → Instances → Create Instance**.
3. **Name**: `lotusgift-prod-api`.
4. **Image and shape**:
   - Click **Change image** → **Canonical Ubuntu 24.04** → `aarch64` (the latest `Canonical-Ubuntu-24.04-aarch64-*` build).
   - Click **Change shape** → **Ampere** tab → `VM.Standard.A1.Flex` → set OCPUs=`4`, Memory=`24` GB. Confirm the **Always Free eligible** badge appears.
5. **Networking**:
   - Pick the default VCN, default public subnet.
   - **Assign a public IPv4 address** = **YES**.
6. **SSH keys**: paste your workstation's `~/.ssh/id_ed25519.pub` (or generate fresh — Step 2 needs the matching private key).
7. **Boot volume**: leave at 50 GB (Always Free).
8. Click **Create**. Wait ~2 minutes for provisioning. Capture the **public IP** when the instance reaches `Running`.

> **Operator note.** If you see "Out of host capacity" — common for free-tier A1.Flex in Mumbai during India business hours — retry every 30 minutes or try the Hyderabad region (`ap-hyderabad-1`). Capacity returns intermittently.

### Add inbound security rules

The default VCN allows only SSH (:22). We need :80 (Certbot HTTP-01 + redirect) and :443 (HTTPS).

1. Compute → Instances → click the instance → **Virtual cloud network** link.
2. Click the **Default Security List for `vcn-xxxx`** under Security Lists.
3. **Add Ingress Rules**:
   - `Source CIDR = 0.0.0.0/0`, `IP Protocol = TCP`, `Destination Port = 80`, description `HTTP for ACME + redirect`.
   - `Source CIDR = 0.0.0.0/0`, `IP Protocol = TCP`, `Destination Port = 443`, description `HTTPS api.lotusgift.com`.
4. Save.

### Point DNS at the VM

In your DNS provider's UI (Cloudflare → DNS → Records):

- `A api.lotusgift.com → <public-ip-from-step-1.8>` — **Proxy status: DNS only** for PR-7. (Proxy mode flips at P22 — see [research note Q2](../research/phase-0-oracle-runbook.md#3-open-questions).)
- Optional `AAAA api.lotusgift.com → <public-ipv6-if-assigned>` — same proxy setting.

Wait for the record to resolve (`dig +short api.lotusgift.com` from your workstation should match the public IP).

---

## Step 2 — OS bring-up + hardening (≈10 min)

SSH in as the default user (`ubuntu` on the Canonical image):

```bash
ssh ubuntu@<public-ip>
```

### Update packages + install baseline tooling

```bash
sudo apt-get update
sudo apt-get -y upgrade
sudo apt-get install -y curl git vim ufw fail2ban
```

### UFW (default deny incoming, allow 22/80/443)

Clone the repo and run the idempotent UFW script:

```bash
sudo git clone https://github.com/goldr0g3r/lotusgift.git /opt/lotusgift-repo
sudo /opt/lotusgift-repo/infrastructure/oracle/security/ufw-rules.sh
sudo ufw status verbose
```

Expected: `Status: active`, default `deny (incoming)`, allow rules for 22/80/443.

### SSH hardening

Drop in the sshd snippet, validate, reload:

```bash
sudo install -m 0644 \
    /opt/lotusgift-repo/infrastructure/oracle/security/sshd_config.snippet \
    /etc/ssh/sshd_config.d/00-lotusgift.conf
sudo sshd -t                  # MUST succeed before reloading
sudo systemctl reload ssh
```

> **CAUTION.** Keep your current SSH session open until you've opened a new one to verify the new sshd config works (key-only auth, no root). If the new session fails, revert in the existing session: `sudo rm /etc/ssh/sshd_config.d/00-lotusgift.conf && sudo systemctl reload ssh`.

### fail2ban

```bash
sudo install -m 0644 \
    /opt/lotusgift-repo/infrastructure/oracle/fail2ban/jail.local \
    /etc/fail2ban/jail.local
sudo install -m 0644 \
    /opt/lotusgift-repo/infrastructure/oracle/fail2ban/filter.d/nginx-limit-req.conf \
    /etc/fail2ban/filter.d/nginx-limit-req.conf
sudo systemctl enable --now fail2ban
sudo fail2ban-client status                       # sshd / nginx-limit-req / nginx-badbots / nginx-noscript jails listed
```

### Logrotate for the heartbeat log

```bash
sudo install -m 0644 \
    /opt/lotusgift-repo/infrastructure/oracle/security/logrotate.d/lotusgift-heartbeat \
    /etc/logrotate.d/lotusgift-heartbeat
```

---

## Step 3 — Docker Engine + GHCR pull credentials (≈8 min)

### Install Docker Engine + Compose v2 from the official apt repo

```bash
# Remove distro packages if present.
sudo apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Add Docker's official GPG + apt repo.
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu noble stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow the deploy user (ubuntu) to use docker without sudo.
sudo usermod -aG docker ubuntu
newgrp docker                                     # take effect in the current shell
docker --version && docker compose version        # sanity check
```

### Pull credentials for GHCR

GHCR images for **public packages** are pullable without auth, but rate-limited. Authenticated pulls get higher limits and let us fetch private packages later if we ever switch the repo to private.

Generate a fine-grained PAT at <https://github.com/settings/personal-access-tokens> (or reuse the one from [`docs/runbooks/github-setup.md`](github-setup.md#step-2--provision-a-pat-with-the-right-scope-2-minutes)):

- Repository access: `goldr0g3r/lotusgift` (or all).
- Repository permissions: **Packages → Read-only**.
- Account permissions: none required.
- Expiry: 90 days; rotate quarterly via the same form.

On the VM:

```bash
echo "<the-PAT>" | docker login ghcr.io -u goldr0g3r --password-stdin
# Login Succeeded
# Credentials saved at /home/ubuntu/.docker/config.json (chmod 0600 by docker login).
```

---

## Step 4 — nginx + Certbot (≈10 min)

### Install nginx 1.27 from the official `nginx.org` repo

The Ubuntu-shipped nginx is 1.24; we need 1.27 for the `http2 on;` syntax used in our vhost.

```bash
sudo apt-get install -y curl gnupg2 ca-certificates lsb-release ubuntu-keyring
curl https://nginx.org/keys/nginx_signing.key | gpg --dearmor \
    | sudo tee /usr/share/keyrings/nginx-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/nginx-archive-keyring.gpg] \
  http://nginx.org/packages/ubuntu noble nginx" | \
    sudo tee /etc/apt/sources.list.d/nginx.list >/dev/null
sudo apt-get update
sudo apt-get install -y nginx
nginx -v                                          # nginx version: nginx/1.27.x
```

### Drop in the LotusGift configs

```bash
# Snippets directory used by the vhost include directives.
sudo mkdir -p /etc/nginx/snippets /etc/nginx/sites-available /etc/nginx/sites-enabled

# Replace the distro nginx.conf with the repo source-of-truth.
sudo install -m 0644 \
    /opt/lotusgift-repo/infrastructure/oracle/nginx/nginx.conf \
    /etc/nginx/nginx.conf

# Snippets.
for snippet in ssl security-headers proxy-params letsencrypt-acme connection-upgrade-map; do
    sudo install -m 0644 \
        "/opt/lotusgift-repo/infrastructure/oracle/nginx/snippets/${snippet}.conf" \
        "/etc/nginx/snippets/${snippet}.conf"
done

# Vhost — render the ${LOTUSGIFT_API_HOST} placeholder, AND temporarily
# comment out the :443 server block. The :443 block references certs that
# don't exist yet, so a `nginx -t` against the full file would fail. We
# uncomment + reload after Certbot succeeds (Step 4 second half below).
sudo sed -e "s/\${LOTUSGIFT_API_HOST}/api.lotusgift.com/g" \
    /opt/lotusgift-repo/infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf \
    | sudo tee /etc/nginx/sites-available/api.lotusgift.com.conf >/dev/null

# Sentinel comment the :443 block. We restore by running `git checkout`
# below after the certs exist.
sudo sed -i '/^# Port :443/,$ s/^/# certbot-bootstrap-pending: /' \
    /etc/nginx/sites-available/api.lotusgift.com.conf

sudo ln -sf /etc/nginx/sites-available/api.lotusgift.com.conf \
            /etc/nginx/sites-enabled/api.lotusgift.com.conf

# Webroot for ACME challenges.
sudo mkdir -p /var/www/letsencrypt/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/letsencrypt

# Validate the (cert-less) config — MUST succeed now that the :443 block is
# commented out.
sudo nginx -t

# Bring nginx up on :80 only so Certbot HTTP-01 can resolve.
sudo systemctl enable --now nginx
```

### First Let's Encrypt cert issuance

```bash
sudo LOTUSGIFT_API_HOST=api.lotusgift.com \
     LOTUSGIFT_ACME_EMAIL=ops@lotusgift.com \
     /opt/lotusgift-repo/infrastructure/oracle/scripts/certbot-bootstrap.sh
```

Expected output: `Successfully received certificate.` plus the renewal timer (`snap.certbot.renew.timer`) listed under `systemctl list-timers`.

Uncomment the :443 server block (if you commented it earlier), then:

```bash
sudo nginx -t
sudo systemctl reload nginx
curl -fsS https://api.lotusgift.com/.well-known/acme-challenge/test          # 404 expected (proves :443 is up via TLS)
```

### Verify TLS posture

```bash
curl -fsS -o /dev/null -w "%{http_code} %{ssl_verify_result} %{redirect_url}\n" \
    https://api.lotusgift.com/                                       # 502 (upstream not yet running) is fine — just confirm TLS terminates
echo Q | openssl s_client -connect api.lotusgift.com:443 -servername api.lotusgift.com 2>/dev/null \
    | openssl x509 -noout -dates -issuer -subject
```

---

## Step 5 — Lay down `/opt/lotusgift/` + populate `.env.production` (≈5 min)

```bash
# Working tree mirrors infrastructure/oracle/. Use the repo as the source.
sudo mkdir -p /opt/lotusgift/{compose,scripts,logs}
sudo cp /opt/lotusgift-repo/infrastructure/oracle/compose/docker-compose.prod.yml \
        /opt/lotusgift/compose/
sudo cp /opt/lotusgift-repo/infrastructure/oracle/scripts/*.sh \
        /opt/lotusgift/scripts/
sudo chmod +x /opt/lotusgift/scripts/*.sh

# Environment template.
sudo install -m 0640 -o ubuntu -g ubuntu \
    /opt/lotusgift-repo/infrastructure/oracle/.env.production.example \
    /opt/lotusgift/.env.production
sudo chown -R ubuntu:ubuntu /opt/lotusgift

# Open the env file and fill in the real values (Atlas URI, Upstash URL,
# BETTER_AUTH_SECRET via `openssl rand -base64 32`, etc.).
sudo $EDITOR /opt/lotusgift/.env.production
```

> **Operational invariant.** NEVER `git commit` the populated `.env.production`. The `.gitignore` excludes `**/.env*` patterns; check with `git status` if you ever sync the file in either direction.

---

## Step 6 — Wire systemd units (≈3 min)

```bash
# Service + timer for the api-gateway and the heartbeat.
sudo install -m 0644 /opt/lotusgift-repo/infrastructure/oracle/systemd/lotusgift-api.service        /etc/systemd/system/
sudo install -m 0644 /opt/lotusgift-repo/infrastructure/oracle/systemd/lotusgift-heartbeat.service  /etc/systemd/system/
sudo install -m 0644 /opt/lotusgift-repo/infrastructure/oracle/systemd/lotusgift-heartbeat.timer    /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable lotusgift-heartbeat.timer       # do NOT start the timer yet — wait until the api is up
# lotusgift-api.service starts in Step 7 via the deploy script (which sets IMAGE_TAG appropriately).
```

---

## Step 7 — First manual deploy (≈3 min)

```bash
# Validate compose can pull the latest main image (build-push job has been
# running on PRs since this runbook landed, so :main exists in GHCR).
cd /opt/lotusgift/compose
docker compose -f docker-compose.prod.yml config                              # validates YAML + resolves env

# Trigger the deploy script. First-run only: tag = main.
/opt/lotusgift/scripts/deploy.sh main

# Smoke-check via nginx.
curl -fsS https://api.lotusgift.com/healthz | jq
# {"status":"ok","uptimeSec":7,"timestamp":"2026-05-13T17:00:00.123Z"}

# Now that the API is healthy, start the systemd service so it survives reboots.
sudo systemctl enable --now lotusgift-api.service
sudo systemctl status lotusgift-api.service --no-pager

# Start the heartbeat timer.
sudo systemctl start lotusgift-heartbeat.timer
systemctl list-timers lotusgift-heartbeat.timer       # NEXT entry should be within 6h
```

---

## Step 8 — Wire GitHub Actions secrets + first auto-deploy (≈4 min)

The `.github/workflows/deploy-oracle.yml` workflow's `deploy` + `verify` jobs are gated on `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED == 'true'`. Until you flip the variable, they no-op on every push.

### Set repo variables (Public — visible in workflow logs)

`https://github.com/goldr0g3r/lotusgift/settings/variables/actions` → **New repository variable**:

| Name | Value |
| --- | --- |
| `LOTUSGIFT_API_HOST` | `api.lotusgift.com` |
| `LOTUSGIFT_ORACLE_DEPLOY_ENABLED` | `true` |

### Set repo secrets (Encrypted — never echoed in logs)

`https://github.com/goldr0g3r/lotusgift/settings/secrets/actions` → **New repository secret**:

| Name | Value |
| --- | --- |
| `ORACLE_SSH_HOST` | public IPv4 from Step 1 |
| `ORACLE_SSH_USER` | `ubuntu` |
| `ORACLE_SSH_KEY` | private key (PEM) matching `~/.ssh/authorized_keys` on the VM |

> **SSH key for CI.** Generate a dedicated key on your workstation: `ssh-keygen -t ed25519 -f ~/.ssh/lotusgift-ci -C "github-actions@lotusgift"`. Append the `.pub` to `/home/ubuntu/.ssh/authorized_keys` on the VM (`cat ~/.ssh/lotusgift-ci.pub | ssh ubuntu@<ip> 'cat >> ~/.ssh/authorized_keys'`). Paste the **private** key as `ORACLE_SSH_KEY`.

### Trigger the first auto-deploy

Push any commit to `main` (or use the **Actions → deploy-oracle → Run workflow** dropdown for an immediate `workflow_dispatch`). Watch the run at `https://github.com/goldr0g3r/lotusgift/actions/workflows/deploy-oracle.yml`:

1. `build-push` builds the linux/amd64 + linux/arm64 manifest, pushes to `ghcr.io/goldr0g3r/lotusgift-api:sha-<sha>` + `:main` — runs every push, regardless of the gate.
2. `deploy` SSHes in + runs `/opt/lotusgift/scripts/deploy.sh sha-<sha>`.
3. `verify` curls `https://api.lotusgift.com/healthz` — expects `200 OK`.

If the run is red, see [Operational recipes §9](#9-operational-recipes-rollback-scale-restart-logs-cert-cleanup) below.

---

## 9. Operational recipes (rollback, scale, restart, logs, cert, cleanup)

### Rollback to the last-known-good tag

```bash
ssh ubuntu@<vm-ip>
/opt/lotusgift/scripts/rollback.sh        # reads /opt/lotusgift/.last-good-tag and re-deploys
```

### Restart the api-gateway

```bash
sudo systemctl restart lotusgift-api.service           # docker compose down + up
docker compose -f /opt/lotusgift/compose/docker-compose.prod.yml ps
```

### Tail logs

```bash
# api-gateway container logs (json-file driver capped at 10MB x 5 files).
docker logs -f lotusgift-api-gateway

# systemd journal for the wrapper unit (boot ordering, daemon errors).
sudo journalctl -u lotusgift-api.service -f

# nginx access log (JSON).
sudo tail -F /var/log/nginx/access.log | jq

# heartbeat log (rotated daily, 100 KB cap).
sudo tail -F /var/log/lotusgift/heartbeat.log
```

### Force a fresh cert (90-day expiry — auto-renews via snap timer)

```bash
sudo certbot renew --dry-run         # validate
sudo certbot renew --force-renewal   # actual renewal (rare; only if cert is broken)
sudo systemctl reload nginx          # deploy-hook runs this automatically
```

### Disk + image hygiene

```bash
docker image prune -f --filter "until=24h"      # also done at the end of every deploy.sh
docker system df -v                              # see what's eating disk
sudo journalctl --vacuum-time=14d                # cap journal at 14 days
sudo du -sh /var/lib/docker/                     # spot blow-ups early
```

### Suspend auto-deploy temporarily

Flip `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED` to `false` in the repo Variables UI. The `deploy` + `verify` jobs become no-ops on the next push. `build-push` keeps running so images stay current; flip back to `true` to resume deploys.

### Reprovision from scratch (Oracle reclaimed the VM)

Run sections 1–8 again. Atlas + Upstash hold all state — the new VM stands up empty and the api-gateway connects to the same datastores. Operational downtime: ~1 hour, mostly waiting on DNS propagation.

---

## 10. Quarterly review checklist

Every 90 days post-provisioning, run [`docs/runbooks/oracle-quarterly-review.md`](oracle-quarterly-review.md). It covers cert renewal validation, the full 14-command audit-drift diff against [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md), fail2ban audit, Oracle billing review, SSH key rotation, Docker hygiene, and heartbeat health — plus a per-quarter findings template at `docs/quarterly-reviews/YYYY-QN.md`.

---

## Operational invariants

These rules are non-negotiable; violating them breaks the audit trail or the deploy pipeline.

1. **Never edit `/etc/nginx/`, `/etc/systemd/system/lotusgift-*`, `/etc/fail2ban/`, or `/opt/lotusgift/compose/*` directly on the host.** Change the repo source first, PR + merge, then re-apply on the host via the `sudo install -m 0644 ...` commands from this runbook. The audit-drift diffs in [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md#audit--drift-detection) MUST pass.
2. **Never update an image tag in `/opt/lotusgift/compose/docker-compose.prod.yml` by hand.** The `IMAGE_TAG` env var is set by `deploy.sh`; that's the only path that touches it.
3. **Never `docker pull` + `docker run` without going through `deploy.sh`.** The script is the single place that records the last-good tag and does the healthcheck wait — bypassing it loses rollback capability.
4. **Never commit a populated `.env.production`.** Even briefly. If it slips in, force-push the deletion + rotate every secret in the file.
5. **Rotate the CI SSH key every 90 days.** Generate a new one on your workstation, append the `.pub` to the VM's `~/.ssh/authorized_keys`, paste the new private key into the `ORACLE_SSH_KEY` repo secret, then `ssh-keygen -R` + remove the old `.pub` from `authorized_keys`.
6. **Watch the Oracle billing dashboard weekly via the `free-tier-burn` cron** (lands fully in PR-8). The 70%-of-quota threshold opens a research-note follow-up automatically.
7. **The runbook IS the source-of-truth for the VM**, not your shell history. If you do something on the VM that isn't in this file, that's a bug — PR a change to this runbook documenting it.

---

## Related docs

- [`docs/research/phase-0-oracle-runbook.md`](../research/phase-0-oracle-runbook.md) — decisions + retrieval-dated citations backing every choice above.
- [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md) — file-tree map + audit-drift commands.
- [`docs/runbooks/github-setup.md`](github-setup.md) — sibling runbook that bootstrapped the GitHub side (issues, labels, milestones, project board, branch protection).
- [`.github/workflows/deploy-oracle.yml`](../../.github/workflows/deploy-oracle.yml) — the CI surface this runbook hands off to.
- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — PR-7 line links here.
