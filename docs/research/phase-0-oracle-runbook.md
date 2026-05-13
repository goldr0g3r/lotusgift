# Phase-0 Oracle deploy runbook research note

**Date:** 2026-05-13
**Phase:** 0
**Workstream:** infra
**Layer:** L0 (deploy + runtime)
**Sub-plan:** [`.cursor/plans/p0-oracle-runbook_pr-7_a42eff2d.plan.md`](../../.cursor/plans/p0-oracle-runbook_pr-7_a42eff2d.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

This note backs the Oracle Cloud production-deploy surface ship for PR-7. Every dependency below is retrieval-dated per the `always-latest-docs.mdc` rule.

## 1. Sources reviewed (retrieval-dated 2026-05-13)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Oracle Always Free A1.Flex (Ampere ARM) | <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm> | 3,000 OCPU-hours + 18,000 GB-RAM-hours per month per Always Free tenancy — equivalent to one 24×7 VM with 4 OCPUs + 24 GB RAM. Boot volume + 200 GB total block volume free. Mumbai region (`ap-mumbai-1`) supported. |
| 2 | Oracle Always Free idle-reclaim policy | <https://oracommit.blogspot.com/2026/02/understanding-oci-always-free-compute.html> | Reclaim triggers only when ALL of the following are true for a continuous 7-day window: CPU < 20% p95 AND memory < 20% AND network < 20%. Boot volume survives the reclaim. Reclaim is automatic, no notice. Heartbeat-mitigated by any small periodic workload. |
| 3 | Certbot install via snap | <https://certbot.eff.org/instructions?os=snap&ws=nginx> | `snap install --classic certbot` + `ln -s /snap/bin/certbot /usr/local/bin/certbot`. Snap auto-installs a systemd timer for renewal (`snap.certbot.renew.timer`). `--deploy-hook 'systemctl reload nginx'` fires after each successful renewal. |
| 4 | Certbot webroot mode (HTTP-01) | <https://eff-certbot.readthedocs.io/en/stable/using.html#webroot> | `certbot certonly --webroot -w /var/www/letsencrypt -d <host>` keeps nginx running through issuance (no `--standalone` outage). Webroot must serve `/.well-known/acme-challenge/`. |
| 5 | nginx 1.27 TLS 1.3 + HTTP/2 hardening | <https://letsecure.me/nginx-ssl-hardening-checklist-2026/> | nginx 1.25+ has native TLS 1.3 + `http2 on;` syntax (the old `listen 443 ssl http2;` flag is deprecated). Mozilla Intermediate ciphersuite for TLS 1.2; TLS 1.3 ciphers are OpenSSL-managed. HSTS `max-age=63072000; includeSubDomains; preload` for HSTS-preload eligibility. |
| 6 | Mozilla SSL Configuration Generator | <https://ssl-config.mozilla.org/> | Intermediate profile covers all browsers ≥ 2018 (no IE/Android-stock-browser support needed for a B2B India launch). |
| 7 | UFW + fail2ban on Ubuntu 24.04 | <https://oneuptime.com/blog/post/2026-03-02-how-to-configure-fail2ban-with-ufw-on-ubuntu/view> | UFW + fail2ban are complementary: UFW handles default-deny + allow-list (22/80/443); fail2ban watches logs and adds time-boxed UFW deny rules per offending IP. Recommended `banaction = ufw` in `jail.local`. |
| 8 | fail2ban nginx jails | <https://oneuptime.com/blog/post/2026-03-02-how-to-configure-fail2ban-jails-for-ssh-apache-and-nginx-on-ubuntu/view> | Built-in `nginx-http-auth` + `nginx-badbots` filters available; custom `nginx-limit-req` filter recommended for catching `limit_req_zone` violations. |
| 9 | systemd timers (OnCalendar + RandomizedDelaySec) | <https://www.freedesktop.org/software/systemd/man/systemd.timer> | `OnCalendar=*-*-* 00/6:00:00` fires every 6h at 00:00/06:00/12:00/18:00. `RandomizedDelaySec=10m` prevents thundering-herd across the tenancy. `Persistent=true` catches up missed firings after reboot. |
| 10 | systemd service Type=oneshot | <https://www.freedesktop.org/software/systemd/man/systemd.service> | `Type=oneshot RemainAfterExit=true` is the canonical wrapper for `docker compose up -d` since the docker daemon owns the long-running process. |
| 11 | GitHub Container Registry (GHCR) | <https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry> | Publish via `docker push ghcr.io/<owner>/<image>:<tag>`. Free + unlimited storage and bandwidth for PUBLIC packages tied to a public repo. Auth via `GITHUB_TOKEN` (workflow) or fine-grained PAT with `read:packages` / `write:packages` (host). |
| 12 | `docker/build-push-action@v6` | <https://github.com/docker/build-push-action/releases/tag/v6.19.0> | v6.19.0 released 2026-02-11. Pair with `docker/setup-buildx-action@v3` + `docker/setup-qemu-action@v3` for `linux/amd64,linux/arm64` builds in one push. Use `cache-from: type=gha` + `cache-to: type=gha,mode=max` for build caching. |
| 13 | `appleboy/ssh-action@v1` | <https://github.com/appleboy/ssh-action/releases/tag/v1.2.5> | v1.2.5 released 2026-01-28. Pure-Go SSH client; supports `key` + `host` + `username` + `script` inputs. We use `host` from `secrets.ORACLE_SSH_HOST`, key from `secrets.ORACLE_SSH_KEY`, and `script: /opt/lotusgift/scripts/deploy.sh ${{ github.sha }}`. |
| 14 | `node:22-alpine` | <https://hub.docker.com/_/node/tags?name=22-alpine> | Node 22 LTS on Alpine 3.21. Minimal base image (~50 MB). `corepack enable && corepack prepare pnpm@9.0.0 --activate` ships pnpm without an extra layer. |
| 15 | Ubuntu 24.04 LTS (Noble Numbat) | <https://wiki.ubuntu.com/Releases> | Default Oracle ARM image; supported until April 2029 (standard) / April 2036 (ESM). Includes Docker Engine 27+, systemd 255+, nginx 1.24 (we upgrade to 1.27 via the official nginx repo for HTTP/2 syntax). |
| 16 | `dumb-init` PID 1 | <https://github.com/Yelp/dumb-init> | Minimal init that forwards SIGTERM/SIGINT to the wrapped Node process. Available via Alpine package `dumb-init`. |
| 17 | Docker Compose v2 | <https://docs.docker.com/compose/install/linux/> | Replaces legacy `docker-compose` (v1). Ships with `docker-ce`; invoke as `docker compose ...`. Supports `restart: unless-stopped`, healthcheck-aware `up -d --wait`, and `--no-deps` for partial restarts. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Container registry | GHCR (`ghcr.io/goldr0g3r/lotusgift-api`) | Docker Hub (rate-limited free anonymous pulls), AWS ECR (paid + sign-up friction) | Public repo = free + unlimited bandwidth; auth via `GITHUB_TOKEN` already available in Actions. |
| D2 | TLS issuer | Let's Encrypt via Certbot snap (HTTP-01 webroot) | Cloudflare Origin Cert (vendor-locks; doesn't validate without proxy); DNS-01 (needs Cloudflare API token in CI) | Webroot keeps nginx running through issuance; LE is free + auto-renewing; doesn't pin us to Cloudflare. |
| D3 | nginx location | Host-side (apt-installed from `nginx.org` repo for 1.27+), not in compose | Compose-side (blocks Certbot's `/var/lib/letsencrypt/`); Caddy (less ops familiarity) | Host nginx can share `/var/www/letsencrypt` with Certbot snap; one less compose service to maintain. |
| D4 | Process supervisor | systemd wrapping `docker compose` | docker-only `restart: unless-stopped` (loses host-level boot ordering); pm2 (duplicates docker) | systemd guarantees boot-time start after docker.service + network-online; one unit file means `systemctl status lotusgift-api` for everything. |
| D5 | Zero-downtime swap | `docker compose up -d --no-deps api-gateway` with HEALTHCHECK wait (60s) | Blue/green with two compose profiles (complex; defer to P22); k8s (out of scope at single-VM) | Compose v2's healthcheck-aware up + a Docker HEALTHCHECK in the image keeps the old container running until the new one is healthy — sufficient for the modular-monolith MVP. |
| D6 | Heartbeat cadence | systemd timer `OnCalendar=*-*-* 00/6:00:00` (every 6h, 00:00/06:00/12:00/18:00 UTC) | cron (less ergonomic logs); 1h timer (overkill); 24h timer (close to the 7-day margin) | 4 firings/day gives 4×7=28 events per reclaim-window vs the threshold of zero non-idle samples. |
| D7 | Heartbeat workload | `yes > /dev/null & PID=$!; sleep 10; kill $PID` + outbound `curl` to `/healthz` | stress-ng (extra apt dep); long-running daemon (wastes CPU); 1s burst (too short to register in p95) | 10s on a 4-OCPU machine = ~25% on one core for 10s — comfortably above the 20% threshold for the sampling window, near-zero impact on api-gateway. |
| D8 | Mongo + Redis location | Off-VM (Atlas M0 + Upstash Redis), per parent plan §9 | Self-host on the VM | Self-host burns 4-6 GB RAM of the 24 GB budget and adds ops burden. Atlas/Upstash both free in Mumbai region. |
| D9 | Deploy trigger | `push: branches: [main]` + `push: tags: [v*]` + `workflow_dispatch` + repo-variable gate (`vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED == 'true'`) | tag-only (slows iteration); cron (drift); manual-only (forgetful) | Main-push trigger keeps preview-quality on the VM; gate variable means PR-7 ships without a live VM (deploys are no-ops until the flag flips). |
| D10 | API subdomain | `api.lotusgift.com` as the documented placeholder, parameterised via `${LOTUSGIFT_API_HOST}` env in nginx template + `vars.LOTUSGIFT_API_HOST` in CI | Hard-coded (less flexible); separate per-env (premature for MVP) | One subdomain for the MVP; runbook substitution step takes a single sed command. |
| D11 | First Dockerfile shape | Multi-stage on `node:22-alpine`: `deps` (pnpm fetch) → `build` (pnpm turbo build) → `runtime` (non-root `nestjs` user, `dumb-init` PID 1, `EXPOSE 3001`, `HEALTHCHECK` on `/healthz`) | Distroless (no shell for debug); slim (~150 MB vs alpine ~50 MB); root user (security) | Matches 2026 Node-Docker best practice; alpine + non-root + dumb-init is the well-trodden modular-monolith shape. |
| D12 | Buildx platform list | `linux/amd64,linux/arm64` (multi-arch manifest under one tag) | linux/arm64-only (breaks local docker dev on Windows/Mac); linux/amd64-only (won't run on the ARM VM) | `docker manifest inspect ghcr.io/.../lotusgift-api:main` shows both platforms; docker pulls the matching one automatically. |
| D13 | nginx upgrade path | Add `nginx.org` apt repo to get nginx 1.27 (HTTP/2 `http2 on;` syntax) on Ubuntu 24.04 | Stay on Ubuntu 1.24 (deprecated `listen ... http2` flag) | Forward-compat with the 2026 nginx syntax; runbook documents one-time apt-source add. |
| D14 | SSH hardening level | PermitRootLogin no + PasswordAuthentication no + key-only + ClientAliveInterval 300 | Default ssh config (passwords on); Port-randomisation (security through obscurity) | Standard set; key-only is the only auth path. UFW + fail2ban add rate-limit + ban-on-failure on top. |
| D15 | Logrotate for heartbeat | Snippet at `infrastructure/oracle/security/logrotate.d/lotusgift-heartbeat` capping at 7 days + 100 KB | Append to `/var/log/syslog` (noisy); no rotation (disk fill) | Heartbeat logs are observability + audit; dedicated file with size cap matches systemd-journald spillover pattern. |

## 3. Open questions

- **Q1**: Terraform module for one-click Oracle VM provisioning? Not in PR-7 — manual click-through is documented; revisit at P22 launch if the team scales beyond solo.
- **Q2**: Cloudflare proxy in front of nginx? Documented as **DNS-only** for PR-7; the proxy mode requires `X-Forwarded-For` trust-list audit for Razorpay webhook signature verification — defer the flip to P22.
- **Q3**: Multi-arch buildx (amd64 + arm64) cost on GHA runners — covered in D12; emerges in <3 min for the create-turbo placeholder.
- **Q4**: Heartbeat over public URL vs localhost — localhost only inside the heartbeat script (mitigates idle-reclaim, not uptime SLO). UptimeRobot HTTPS check (free 5-min interval) handles uptime monitoring separately; documented in `docs/runbooks/oracle-deploy.md` §9 forward-pointer.
- **Q5**: Compose v2 vs Swarm/Nomad — Compose suffices for single-VM; revisit at P22 launch.

## 4. Implementation checklist

- [ ] `apps/api-gateway/Dockerfile` + `.dockerignore` (multi-stage; non-root; dumb-init PID 1; HEALTHCHECK on `/healthz`)
- [ ] `infrastructure/oracle/compose/docker-compose.prod.yml` (single api-gateway service, GHCR pull, 127.0.0.1:3001 only, json-file logging 10MBx5)
- [ ] `infrastructure/oracle/nginx/` (nginx.conf + sites-available + 4 snippets, HTTP/2 + TLS 1.3 + HSTS + security headers + proxy-params)
- [ ] `infrastructure/oracle/scripts/certbot-bootstrap.sh` (idempotent snap install + webroot issuance + deploy-hook)
- [ ] `infrastructure/oracle/security/ufw-rules.sh` + `sshd_config.snippet` + `logrotate.d/lotusgift-heartbeat`
- [ ] `infrastructure/oracle/fail2ban/jail.local` + `filter.d/nginx-limit-req.conf`
- [ ] `infrastructure/oracle/systemd/` (`lotusgift-api.service`, `lotusgift-heartbeat.service`, `lotusgift-heartbeat.timer`)
- [ ] `infrastructure/oracle/scripts/heartbeat.sh` + `deploy.sh` + `rollback.sh` + `healthcheck.sh`
- [ ] `infrastructure/oracle/.env.production.example` with `# provenance: P<N>` comments (NODE_ENV, PORT, LOG_LEVEL, MONGO_URI, REDIS_URL, BetterAuth secret + URL + cookie, OTLP exporter, Sentry DSN, Razorpay keys)
- [ ] `infrastructure/oracle/README.md` (tree + apply order + audit-drift commands)
- [ ] `.github/workflows/deploy-oracle.yml` (build-push always; deploy + verify gated on `LOTUSGIFT_ORACLE_DEPLOY_ENABLED`)
- [ ] `infrastructure/github/branch-protection.json` adds `build-push` to required-status-checks contexts; `infrastructure/github/README.md` table updated
- [ ] `docs/runbooks/oracle-deploy.md` (10 sections + Operational invariants appendix)
- [ ] Local smoke: docker build + nginx -t (template-parse) + actionlint + markdownlint + pnpm full pipeline green
- [ ] PR opened, Copilot review iterated, squash-merged
- [ ] Status sync: project board + Epic #4 + Phase-Acceptance #5 + parent plan + this note

## 5. Versions captured

Filled in after merge with the exact versions referenced inside the runbook + workflow + Dockerfile:

| Component | Pin |
| --- | --- |
| `node:22-alpine` | (digest captured from `docker buildx imagetools inspect` post-merge) |
| `docker/setup-qemu-action` | `@v3` |
| `docker/setup-buildx-action` | `@v3` |
| `docker/login-action` | `@v3` |
| `docker/build-push-action` | `@v6` (6.19.0 at time of writing) |
| `appleboy/ssh-action` | `@v1` (1.2.5 at time of writing) |
| `actions/checkout` | `@v6` (matches existing CI workflows) |
| Ubuntu image on Oracle | `Canonical-Ubuntu-24.04-aarch64-2026.04.30-0` (documented; user picks at provision time) |
| nginx | `1.27.x` from `nginx.org` apt repo |
| Certbot | `2.x` from snap channel `stable` |
| Docker Engine | `27.x` from `download.docker.com` apt repo |

Renovate's `pinDigests: true` for `github-actions` will pin all `@vN` references to SHAs in the first Renovate PR after merge.

## 6. Implementation reference

PR-7 landed via PR [#13](https://github.com/goldr0g3r/lotusgift/pull/13) — squash merge SHA [`b6067aca`](https://github.com/goldr0g3r/lotusgift/commit/b6067aca19e69986e17d5a18f1f93e9b3302bd8d).

| Metric | Value |
| --- | --- |
| Files changed (squashed) | 36 |
| Insertions (squashed) | +2,235 |
| Deletions (squashed) | -10 |
| New CI jobs | 1 (`build-push`); `deploy` + `verify` ship gated, no-op until variable flips |
| Branch-protection contexts added | 1 (`build-push`) |
| Sass mixin partials (nginx snippets) | 6 (ssl, security-headers, proxy-params, letsencrypt-acme, connection-upgrade-map, vhost) |
| systemd units | 3 (`lotusgift-api.service`, `lotusgift-heartbeat.{service,timer}`) |
| Operational scripts | 5 (deploy.sh, rollback.sh, healthcheck.sh, heartbeat.sh, certbot-bootstrap.sh) |
| Security hardening files | 4 (ufw-rules.sh, sshd_config.snippet, fail2ban jail.local, fail2ban nginx-limit-req filter) |
| Runbook sections | 10 + Operational invariants appendix |
| Iterations (squashed) | 4 (initial 33-file commit; `pull_request` trigger fix; `ignoreDeprecations` rollback after CI TS5103; 8-of-8 Copilot review fixes) |
| Copilot review comments addressed | 8 (`.dockerignore` at repo root; PR-only build skips push; systemd pins tag via `.image-tag.env`; heartbeat traps `yes` reaper; runbook reorders `nginx -t`; nginx gzip-off comment clarified; fail2ban regex full date+time prefix; jail.local comment matches behaviour) |
| Final CI duration | 16 jobs, longest = `build-push` at 2m51s (linux/amd64 + linux/arm64 multi-arch buildx) |

### Squashed commit timeline (chronological inside the PR)

1. `fe808de` — `feat(infra)` initial 33-file commit (Dockerfile + infra/oracle tree + workflow + runbook + research note + branch protection).
2. `fb85849` — `ci(infra)` add `pull_request` trigger so `build-push` runs on PRs; split into `Build (PR validation only)` (push=false) + `Build + push multi-arch image` (push=true) using `if: github.event_name != 'pull_request'`.
3. `e6cd64e` — `fix(infra)` drop `ignoreDeprecations: "6.0"` from `packages/typescript-config/nestjs.json` (TS 5.5 rejects `"6.0"` as `TS5103: Invalid value`; the local fix isn't needed under the lockfile-pinned TS that CI uses).
4. `c7c03a7` — `fix(infra)` Copilot review pass: 8 separate issues addressed in a single commit (108 insertions, 19 deletions across 8 files).

Squash-merged into main as the single commit `b6067aca`.

### Status-sync trail

- Project board [#9](https://github.com/users/goldr0g3r/projects/9): PR item added, fields set (Status=Done, Phase=P0, Workstream=infra, Layer=L0, Type=feat).
- Epic [#4](https://github.com/goldr0g3r/lotusgift/issues/4) — PR-7 line ticked with PR URL + squash SHA + 8-Copilot-fix summary.
- Phase-Acceptance [#5](https://github.com/goldr0g3r/lotusgift/issues/5) — Oracle runbook + `infrastructure/oracle/` acceptance line ticked.
- Parent plan `.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md` — `p0-oracle-runbook` todo marked completed with full attribution note.
- Branch protection on `main` re-applied via `gh api ... -X PUT` with `build-push` added to `required_status_checks.contexts` (now 15 required contexts total).
- `pr-7-oracle-runbook` branch deleted local + remote.

### Followup parked items (PR-8 / P22)

- Oracle Resource Manager Terraform module (Q1 in §3).
- Cloudflare proxy mode + `X-Forwarded-For` trust list audit for Razorpay webhooks (Q2).
- UptimeRobot 5-min HTTPS check (Q4).
- `recidive` fail2ban jail with 7-day ban for repeat offenders (Copilot review fix-8 deferred).
- `oracle-quarterly-review.md` runbook + re-apply automation (PR-8).
