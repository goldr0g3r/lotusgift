# Hosting: Oracle Cloud A1.Flex Mumbai + Vercel + Cloudflare

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan §9 free-tier strategy
- **Informed:** infra runbook authors (PR-7 oracle-deploy, PR-8 going-to-production)

## Context and Problem Statement

LotusGift v2 must launch on a sustainable free / near-free hosting footprint until P22 (commercial launch), serving an India-only audience ([ADR-001](0001-india-launch-razorpay-and-carrier-aggregator.md)) from a low-latency Mumbai region. Frontend (four Next.js apps), backend (NestJS modular monolith — [ADR-004](0004-modular-monolith-first.md)), and edge concerns (DNS, CDN, TLS) need a coherent home that the founder can administer alone.

## Decision Drivers

- **Mumbai region required** — Indian buyers expect <100 ms p50 server-rendered TTFB; cross-region (e.g., US-East) hosting would push that past 250 ms.
- **Free tier strict requirement until P22** — no monthly infra spend until Razorpay live and GMV exists.
- **Single founder ops** — must be SSH-administerable, ideally with a documented runbook (PR-7).
- **TLS, DDoS protection, and a real domain** are non-negotiable for B2B trust signals.
- **Vercel commercial-use** kicks in at launch; Hobby plan is non-commercial-use only ([citation #9](../research/phase-0-docs.md)). Upgrade timing matters.

## Considered Options

- **Oracle Cloud Always Free A1.Flex (Mumbai, ARM, 4 OCPU / 24 GB RAM) for backend + Vercel Hobby (→ Pro at P22) for 4 Next.js apps + Cloudflare DNS / CDN / proxy.** [chosen]
- AWS Lightsail Mumbai (single $5 / month VPS) + Vercel + Cloudflare.
- Fly.io free tier (3 shared-cpu-1x 256 MB VMs) + Vercel + Cloudflare.
- Single self-managed VPS (DigitalOcean / Linode / Hetzner) + Vercel + Cloudflare.
- All-on-Vercel (Next.js frontends + serverless backend).
- Render Free Tier (web service spins down on idle).

## Decision Outcome

Chosen option: **"Oracle A1.Flex Mumbai + Vercel + Cloudflare"**, because the Oracle Always Free tier offers the only India-region ARM compute with 4 OCPU / 24 GB RAM at zero monthly cost, which comfortably fits the modular-monolith gateway plus nginx + Certbot + a heartbeat-cron + observability agents.

Concrete topology:

- **Backend (api.lotusgift.com):** single Oracle Cloud A1.Flex VM in **Mumbai home region**, running:
  - **nginx** as TLS-terminating reverse proxy on :443 → `apps/api-gateway` on :3001.
  - **Certbot** for Let's Encrypt SSL renewals (cron every 60 days).
  - **`apps/api-gateway`** NestJS process (modular monolith — see ADR-004) under `pm2` or `systemd` (decided in PR-7 runbook).
  - **UFW + fail2ban** for SSH brute-force protection.
  - **Heartbeat cron** every 6 hours hitting `/api/health` (and burning a measurable amount of CPU) to keep 95th-percentile CPU utilisation above the 20 % reclaim threshold ([citation #8](../research/phase-0-docs.md) — Oracle reclaims idle compute after 7 days of `<20 %` 95th-percentile CPU + network + memory).
- **Frontend:** 4 separate Vercel projects on **Hobby plan** until P22 launch, then **Pro upgrade** for commercial-use compliance:
  - `web-customer` → www.lotusgift.com + lotusgift.com
  - `web-vendor` → vendor.lotusgift.com
  - `web-admin` → admin.lotusgift.com
  - `web-customer-service` → support.lotusgift.com
- **Edge:** Cloudflare for DNS, CDN, DDoS protection, WAF; all five subdomains point at Cloudflare proxy → Vercel for the four web apps, → Oracle VM for `api.lotusgift.com`.
- **No serverless backend** — Better-Auth's session pattern + Razorpay's raw-body webhook capture + Redis-backed rate limit / idempotency cache all run cleanest on a persistent process.
- **Single-region launch.** Multi-region (us-east + ap-south) parked until international vendors join (see ADR-001 alternatives).

### Vercel Hobby → Pro upgrade trigger

Pro is required at P22 because Vercel Hobby explicitly bans commercial use ([citation #9](../research/phase-0-docs.md)). Concrete:

- Hobby caps: 4 CPU-hr active CPU, 1 M function invocations, 100 GB-hr function duration per month — sufficient for pre-launch dev preview traffic.
- Pro at $20 / user / month unlocks team collaboration, commercial use, custom domains beyond 50/project, function duration up to 300 s, log drains, spend management.
- Upgrade fires on the same day Razorpay live mode is enabled.

### Oracle idle-reclaim mitigation

The 7-day-idle-reclaim policy ([citation #8](../research/phase-0-docs.md)) requires `(CPU OR network OR memory) 95th-percentile ≥ 20 %`. Mitigations layered, in order of trust:

1. **Real production load** post-P22 keeps the VM warm trivially.
2. **Pre-launch heartbeat cron** every 6 h hits `/api/health/heartbeat` and runs a synthetic 30 s CPU-bound workload (e.g., a deliberate `Buffer.from(...).toString('base64').repeat(N)`) to stay above the 20 % threshold.
3. **Backup strategy** documented in `backup-restore.md` runbook (PR-8) so reclaim is recoverable even if mitigations fail.

### Consequences

- Good, because **zero monthly infra spend** until P22 (Oracle Always Free + Vercel Hobby + Cloudflare Free + Atlas M0 + Upstash free).
- Good, because **Mumbai-region everything** → low buyer-facing latency.
- Good, because **single SSH-administerable VM** maps to one human's mental model.
- Good, because Vercel's Next.js preview deploys per PR give us free PR-by-PR design review surface during P16-P19.
- Bad, because **Oracle reclaim risk** is real until production traffic arrives; heartbeat cron + backup-restore runbook (PR-8) mitigate but don't eliminate.
- Bad, because the **single VM is a single point of failure** for the backend. Mitigation: AMI snapshots in Oracle Object Storage; 30 minute restore-time-objective documented in PR-8.
- Bad, because **ARM-only architecture** means any non-ARM-compatible Node native binary (some sharp / canvas / playwright binaries) requires a multi-arch image build. Mitigation: pin all containers to multi-arch tags.
- Neutral, because Vercel commercial-use clause forces a $20 / user / month spend at P22; planned for in the launch budget.

### Confirmation

- PR-7 runbook contains the full deploy sequence + a smoke test (curl `https://api.lotusgift.com/api/health` returns 200 within 1 s).
- PR-8 `going-to-production.md` runbook checks: Vercel Hobby → Pro upgrade completed, DNS records on Cloudflare match `infrastructure/oracle/cloudflare-records.json` snapshot, Oracle VM `crontab -l` shows heartbeat cron entry.
- PR-8 `backup-restore.md` runbook validates the 30-minute Restore Time Objective via a quarterly DR drill.
- `.github/workflows/deploy-oracle.yml` (PR-7) builds → pushes to GHCR → SSHs into the VM → swaps the running container with zero downtime.

## Pros and Cons of the Options

### Oracle A1.Flex Mumbai + Vercel + Cloudflare [chosen]

- Good, because Oracle Always Free in Mumbai is the only major-cloud free tier offering 4 OCPU + 24 GB ARM in that region.
- Good, because Vercel's Next.js DX is best-in-class and the Hobby plan covers all pre-launch needs.
- Good, because Cloudflare Free covers DNS + DDoS + global CDN at zero cost.
- Bad, because Oracle's idle-reclaim policy needs explicit mitigation (heartbeat cron).
- Bad, because Vercel Hobby's commercial-use ban forces a Pro upgrade at launch.

### AWS Lightsail Mumbai ($5 / month)

- Good, because zero idle-reclaim risk.
- Good, because Lightsail bundles bandwidth and AMI snapshots simply.
- Bad, because **costs money from day 1**, even pre-revenue.
- Bad, because 1 vCPU + 512 MB RAM at $5 tier is half the headroom we'd want for 16 service modules + nginx + Certbot + observability.

### Fly.io free tier

- Good, because edge-deployed; closer-to-user latency.
- Bad, because Fly's "free" tier as of 2026 has shrunk to development-grade resources (3× shared-cpu-1x / 256 MB); insufficient for the modular monolith.
- Bad, because Fly's pricing model has changed multiple times; not a stable infrastructure choice.

### Single self-managed VPS (DigitalOcean / Hetzner)

- Good, because Hetzner's Helsinki / Falkenstein ARM tier is cheap ($4 / month for 2 vCPU + 4 GB RAM).
- Bad, because **no India region** — latency from Europe to Indian buyers exceeds 200 ms.
- Bad, because Hetzner offers no Mumbai region; DigitalOcean Bangalore is 1 vCPU + 1 GB RAM at $6 / month minimum.

### All-on-Vercel (Vercel Functions for backend)

- Good, because zero VM admin.
- Bad, because **Better-Auth's pattern requires a persistent process** (or a complex token-refresh workaround). The `_old` codebase's Better-Auth + raw-body webhook pattern doesn't port cleanly to serverless.
- Bad, because Razorpay webhooks need raw-body capture before any body parser — clunky on Vercel Functions.
- Bad, because Vercel Function cold-starts (1-3 s on Hobby) are unacceptable for B2B checkout flows.
- Bad, because no place to host nginx for `api.lotusgift.com` TLS termination + reverse-proxy controls.

### Render Free Tier

- Good, because zero-config Node deploys.
- Bad, because **the free web-service tier spins down after 15 minutes of idle** — every cold start is a 30+ s warm-up. Unacceptable for production.
- Bad, because no India region for Render's free tier as of 2026.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), section 9 (hosting + free-tier strategy).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citations #8 (Oracle Always Free + idle-reclaim), #9 (Vercel Hobby), #10 (Vercel Pro).
- Forthcoming runbooks: [`docs/runbooks/oracle-deploy.md`](../runbooks/oracle-deploy.md) (PR-7), [`docs/runbooks/going-to-production.md`](../runbooks/going-to-production.md) (PR-8), [`docs/runbooks/free-tier-burn.md`](../runbooks/free-tier-burn.md) (PR-8), [`docs/runbooks/backup-restore.md`](../runbooks/backup-restore.md) (PR-8), [`docs/runbooks/oracle-quarterly-review.md`](../runbooks/oracle-quarterly-review.md) (PR-8).
- Related ADRs:
  - [ADR-001](0001-india-launch-razorpay-and-carrier-aggregator.md) — India-only scope justifies single-Mumbai-region.
  - [ADR-004](0004-modular-monolith-first.md) — the single-process backend that this hosting model targets.
  - [ADR-006](0006-atlas-search-m0-budget-3-indexes.md) — companion data-tier hosting decision (MongoDB Atlas M0 AWS Mumbai).
