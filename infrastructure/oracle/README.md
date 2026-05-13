# `infrastructure/oracle/` — production-deploy artefacts

Source-of-truth for everything that lives on the LotusGift Oracle Cloud A1.Flex VM (`api.lotusgift.com`). Apply via the step-by-step runbook at [`docs/runbooks/oracle-deploy.md`](../../docs/runbooks/oracle-deploy.md) — this README is the index + audit/drift cheat-sheet.

```text
infrastructure/oracle/
├── README.md                              # this file
├── .env.production.example                # runtime env template (copy to /opt/lotusgift/.env.production)
├── compose/
│   └── docker-compose.prod.yml            # api-gateway service from GHCR
├── nginx/
│   ├── nginx.conf                         # /etc/nginx/nginx.conf
│   ├── sites-available/
│   │   └── api.lotusgift.com.conf         # /etc/nginx/sites-available/api.lotusgift.com.conf
│   └── snippets/
│       ├── ssl.conf                       # Mozilla Intermediate TLS profile
│       ├── security-headers.conf          # HSTS + CSP-Report-Only + headers
│       ├── proxy-params.conf              # reverse-proxy headers + timeouts
│       ├── letsencrypt-acme.conf          # /.well-known/acme-challenge/
│       └── connection-upgrade-map.conf    # WebSocket upgrade map (http{} scope)
├── scripts/
│   ├── certbot-bootstrap.sh               # idempotent first-issuance + renewal hook
│   ├── deploy.sh                          # zero-downtime swap (called by CI)
│   ├── rollback.sh                        # re-deploy /opt/lotusgift/.last-good-tag
│   ├── healthcheck.sh                     # public-URL /healthz probe with retries
│   └── heartbeat.sh                       # Oracle idle-reclaim mitigation
├── security/
│   ├── ufw-rules.sh                       # default deny + 22/80/443 allow
│   ├── sshd_config.snippet                # /etc/ssh/sshd_config.d/00-lotusgift.conf
│   └── logrotate.d/
│       └── lotusgift-heartbeat            # /etc/logrotate.d/lotusgift-heartbeat
├── systemd/
│   ├── lotusgift-api.service              # wraps docker compose for the api-gateway
│   ├── lotusgift-heartbeat.service        # one-shot heartbeat invocation
│   └── lotusgift-heartbeat.timer          # every-6h trigger
└── fail2ban/
    ├── jail.local                         # sshd + nginx-limit-req + nginx-badbots
    └── filter.d/
        └── nginx-limit-req.conf           # custom filter for limit_req_zone violations
```

## Apply order

Always run the runbook end-to-end on a fresh VM. The summary order is:

1. Provision the VM (Oracle Cloud Console click-through — see [runbook §1](../../docs/runbooks/oracle-deploy.md#1-provision-the-oracle-a1flex-vm-mumbai)).
2. OS hardening — `security/ufw-rules.sh` + `security/sshd_config.snippet` + apt-install fail2ban + drop in `fail2ban/jail.local` (runbook §2).
3. Docker + GHCR pull creds (runbook §3).
4. nginx + Certbot — drop in `nginx/**` and run `scripts/certbot-bootstrap.sh` (runbook §4).
5. Materialise `/opt/lotusgift/` from this repo + populate `.env.production` (runbook §5).
6. Wire systemd — `systemd/lotusgift-api.service` + `systemd/lotusgift-heartbeat.{service,timer}` (runbook §6).
7. First manual deploy via `scripts/deploy.sh main` (runbook §7).
8. Wire GitHub Actions secrets + flip `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED=true` (runbook §8).

## Audit / drift detection

The repo files are the source-of-truth; the on-host copies must match. Run these diffs quarterly (the quarterly review checklist in PR-8 will reapply via Ansible later):

```bash
# nginx (host -> repo). Note: the `${LOTUSGIFT_API_HOST}` placeholder in repo
# expands to the real subdomain on host, so use `sed` to compare.
sudo diff <(sed 's/${LOTUSGIFT_API_HOST}/api.lotusgift.com/g' \
             infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf) \
          /etc/nginx/sites-available/api.lotusgift.com.conf

sudo diff infrastructure/oracle/nginx/nginx.conf            /etc/nginx/nginx.conf
sudo diff infrastructure/oracle/nginx/snippets/ssl.conf     /etc/nginx/snippets/ssl.conf
sudo diff infrastructure/oracle/nginx/snippets/security-headers.conf /etc/nginx/snippets/security-headers.conf
sudo diff infrastructure/oracle/nginx/snippets/proxy-params.conf     /etc/nginx/snippets/proxy-params.conf
sudo diff infrastructure/oracle/nginx/snippets/letsencrypt-acme.conf /etc/nginx/snippets/letsencrypt-acme.conf
sudo diff infrastructure/oracle/nginx/snippets/connection-upgrade-map.conf /etc/nginx/snippets/connection-upgrade-map.conf

# systemd
sudo diff infrastructure/oracle/systemd/lotusgift-api.service        /etc/systemd/system/lotusgift-api.service
sudo diff infrastructure/oracle/systemd/lotusgift-heartbeat.service  /etc/systemd/system/lotusgift-heartbeat.service
sudo diff infrastructure/oracle/systemd/lotusgift-heartbeat.timer    /etc/systemd/system/lotusgift-heartbeat.timer

# fail2ban
sudo diff infrastructure/oracle/fail2ban/jail.local                       /etc/fail2ban/jail.local
sudo diff infrastructure/oracle/fail2ban/filter.d/nginx-limit-req.conf    /etc/fail2ban/filter.d/nginx-limit-req.conf

# sshd
sudo diff infrastructure/oracle/security/sshd_config.snippet              /etc/ssh/sshd_config.d/00-lotusgift.conf

# logrotate
sudo diff infrastructure/oracle/security/logrotate.d/lotusgift-heartbeat  /etc/logrotate.d/lotusgift-heartbeat

# scripts (live at /opt/lotusgift/scripts/)
for f in deploy.sh rollback.sh healthcheck.sh heartbeat.sh certbot-bootstrap.sh; do
    sudo diff "infrastructure/oracle/scripts/${f}" "/opt/lotusgift/scripts/${f}"
done

# compose
sudo diff infrastructure/oracle/compose/docker-compose.prod.yml \
          /opt/lotusgift/compose/docker-compose.prod.yml
```

Open an issue tagged `area/infra` + `prio/p1-high` on any drift.

## Inputs from outside this tree

- **`.github/workflows/deploy-oracle.yml`** — calls `scripts/deploy.sh` over SSH on every `push: main`, gated on `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED == 'true'`.
- **`apps/api-gateway/Dockerfile`** — built + pushed to `ghcr.io/goldr0g3r/lotusgift-api:<tag>` by the same workflow's `build-push` job (multi-arch `linux/amd64,linux/arm64`).
- **GitHub repo variables + secrets** (set after the VM is provisioned, runbook §8):
  - `vars.LOTUSGIFT_API_HOST` — e.g., `api.lotusgift.com`
  - `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED` — `true` once the VM is ready
  - `secrets.ORACLE_SSH_HOST` — public IP or hostname
  - `secrets.ORACLE_SSH_USER` — deploy user (typically `ubuntu`)
  - `secrets.ORACLE_SSH_KEY` — PEM-formatted private key authorised in `~/.ssh/authorized_keys`

## Future settings reserved for follow-on PRs

- `infrastructure/oracle/cloudflare/` — Cloudflare ruleset JSON (DNS-only mode for PR-7; full proxy at P22 after Razorpay webhook trust audit).
- `infrastructure/oracle/observability/` — Promtail / Grafana Agent configs (P21).
- `infrastructure/oracle/ansible/` — idempotent re-apply playbook (P22 if multi-VM lands).
- `infrastructure/oracle/terraform/` — Resource Manager module for one-click provision (P22 if team scales beyond solo).
