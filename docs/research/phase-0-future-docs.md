# Phase-0 future-docs research note

**Date:** 2026-05-14
**Phase:** 0
**Workstream:** docs
**Layer:** L0 (runbooks)
**Sub-plan:** [`.cursor/plans/p0-future-docs_pr-8_6c3aa171.plan.md`](../../.cursor/plans/p0-future-docs_pr-8_6c3aa171.plan.md)
**Parent plan:** [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

This note backs the 7 Phase-0 closeout runbooks shipped by PR-8 — 6 from the parent plan (`going-to-production.md`, `scaling-up.md`, `free-tier-burn.md`, `incident-response.md`, `backup-restore.md`, `oracle-quarterly-review.md`) plus a 7th (`local-development.md`) added per the user's host-installed Mongo + Redis preference. Every dependency below is retrieval-dated per the `always-latest-docs.mdc` rule.

## 1. Sources reviewed (retrieval-dated 2026-05-14)

| # | Topic | URL | Notes |
| --- | --- | --- | --- |
| 1 | Atlas M0 backup limits | <https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/> | M0 / M2 / M5 free + shared tiers have NO continuous-backup option. Manual `mongodump` / `mongorestore` is the only path. Auto-resume after paused-cluster restore documented separately. |
| 2 | Atlas paused-cluster restore | <https://www.mongodb.com/docs/atlas/backup/restore-free-tier-cluster/> | Paused M0s preserve data; restore = "resume" workflow. Hard cap: data lives in the M0 cluster until it stays paused for 60d, after which it's wiped. |
| 3 | mongodump syntax (8.0) | <https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-ubuntu/> | `mongodump --uri "mongodb+srv://..." --gzip --archive=out.gz` produces a single compressed archive suitable for R2 upload. |
| 4 | Upstash Redis backup / RDB export | <https://upstash.com/docs/redis/howto/importexport> | Free tier supports manual RDB export from the dashboard. No native cron; we implement our own via the Upstash API at P5. Functions data is NOT preserved in the RDB. |
| 5 | Upstash Redis free tier limits | <https://upstash.com/pricing/redis> | 256 MB max data, 500K commands/month, 10 GB bandwidth/month, 1 free DB per account (per region). |
| 6 | Cloudflare R2 object-lifecycle rules | <https://developers.cloudflare.com/r2/buckets/object-lifecycles> | Up to 1000 rules per bucket; actions = `delete` after N days, `transition` to Infrequent Access. Per-prefix scoping (we use `backups/` for time-bound deletion). Eviction within 24h of expiry. |
| 7 | Cloudflare R2 bucket locks | <https://developers.cloudflare.com/r2/buckets/bucket-locks> | Introduced Mar 2025. Used in `backup-restore.md` to lock the `backups/` prefix against accidental deletion. |
| 8 | PostHog self-hosting | <https://posthog.com/docs/self-host> | Identical feature set vs Cloud. India DPDP residency = self-host on AWS Mumbai or self-host on Oracle Mumbai. Trigger captured in `scaling-up.md` as "first enterprise customer requiring India-only residency." |
| 9 | PostHog GDPR / privacy compliance | <https://www.posthog.com/docs/integrate/gdpr> | GDPR + HIPAA + CCPA covered. DPDP not explicitly named (relies on self-host for residency). |
| 10 | OWASP ASVS 5.0.0 | <https://asvs.dev/> | Released May 2025 (Global AppSec EU Barcelona). Level 2 = recommended for apps holding sensitive data. PR-8 `going-to-production.md` sets ASVS 5.0 Level 2 as the launch acceptance gate. |
| 11 | NIST SP 800-61 rev 3 | <https://csrc.nist.gov/pubs/sp/800/61/r3/final> | April 2025; supersedes rev 2 (2012). Aligns with CSF 2.0 (Govern/Identify/Protect/Detect/Respond/Recover). PR-8 `incident-response.md` references this lifecycle but defers full CSF mapping to a P22 follow-up. |
| 12 | RFC 5424 syslog severity | <https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1> | 8-level severity; PR-8 `incident-response.md` collapses to 3 SEV levels (1/2/3) appropriate for MVP single-operator. RFC mapping documented for future scale. |
| 13 | MongoDB Community 8.0 on Ubuntu 24.04 | <https://www.mongodb.com/docs/v8.0/tutorial/install-mongodb-on-ubuntu/> | Official apt repo `repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0`. `mongodb-org` package (NOT distro `mongodb`). Default port 27017. Authentication off by default — `local-development.md` warns. |
| 14 | Redis 8 on Ubuntu 24.04 | <https://redis.io/docs/latest/operate/oss_and_stack/install/install-stack/apt/> | Official apt repo `packages.redis.io/deb`. `redis` package autostarts + boot-enabled. Used by `local-development.md` Ubuntu section. |
| 15 | Redis on macOS via Homebrew | <https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-mac-os> | `brew install redis` + `brew services start redis`. Used by `local-development.md` macOS section. |
| 16 | Redis on Windows (Memurai) | <https://redis.io/docs/latest/operate/oss_and_stack/install/archive/install-redis/install-redis-on-windows> | Memurai is the official Redis-on-Windows partner. WSL2 + Ubuntu apt is the alternative. `local-development.md` documents both. |
| 17 | Cloudflare R2 storage classes | <https://developers.cloudflare.com/r2/buckets/storage-classes> | Standard + Infrequent Access. Backup objects transition Standard → IA after 30 days via lifecycle rule. |
| 18 | Vercel Hobby plan limits | <https://vercel.com/docs/limits/usage> | 100 GB outbound bandwidth/month, 100 GB-hours function compute, 6000 build minutes. Trigger to upgrade to Pro = 70% of any axis (per `scripts/free-tier-quota-burn.ts` line 224). |
| 19 | Oracle Cloud Always Free A1.Flex (already cited in phase-0-oracle-runbook.md) | <https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier.htm> | Cross-reference for `oracle-quarterly-review.md` cert renewal + idle reclaim checks. |
| 20 | Atlas Search M0 free tier (3-index cap) | <https://www.mongodb.com/docs/atlas/atlas-search/atlas-search-overview/> | M0 caps Atlas Search at 3 indexes + 5 collections per index + 2M docs total. Trigger to upgrade documented in `scaling-up.md`. |

## 2. Decisions log

| # | Decision | Choice | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | PR scope | Docs-only, no code touches | Mix docs + Ansible playbook (defer to P22 per oracle-quarterly-review.md) | Keeps the review surface focused; no CI risk. |
| D2 | Runbook count | 7 (6 from parent plan + 1 `local-development.md` per user preference) | 6 only | User explicitly preferred host-installed Mongo + Redis over the PR-5 docker compose stack; document the choice. |
| D3 | Depth template | `docs/runbooks/github-setup.md` shape (~120-200 lines each) | `oracle-deploy.md` heavy template (3x effort) | Medium depth = actionable today, manageable review surface, room to deepen in future PRs. |
| D4 | Local-dev positioning | Host install (apt / brew / winget) is preferred; docker compose is fallback | Docker compose first | Matches user preference + faster startup + no Docker Desktop license issues + matches what most contributors already have locally. |
| D5 | free-tier-burn docs source | Documents the EXISTING `scripts/free-tier-quota-burn.ts` (lines 88-334 implement the per-vendor checks) — no new code | Re-author or extend the script in this PR | Single source-of-truth = the script; doc snapshots the quotas as of 2026-05-14 and points readers at the script for live values. |
| D6 | Backup procedure | Atlas M0 = scheduled `mongodump --gzip --archive` to R2 (M0 has no continuous backups per source 1); Upstash = scheduled RDB export to R2 (no native cron, custom job per source 4); R2 = versioning + 30-day lifecycle to IA (sources 6 + 17); code = already in git | Atlas Backup add-on (paid; defer to M10 at P22); third-party backup vendors (out of scope) | Free-tier-compliant + minimal moving parts. Concrete cron impl deferred to P3 / P5. |
| D7 | Incident classification | 3 SEV levels: SEV-1 (full outage / data integrity), SEV-2 (degraded), SEV-3 (single-feature). No SEV-0 for MVP single-operator | NIST SP 800-61 rev 3 full CSF 2.0 mapping (overkill MVP) | Simple to remember + maps cleanly to RFC 5424 severities 3/4/5; CSF 2.0 mapping deferred to a P22 ADR. |
| D8 | Status page vendor | Vendor-neutral language in `incident-response.md` for PR-8; pick at P22 launch | Pre-commit now (Statuspage.io / Better-Stack / Instatus) | No usage signal yet; vendor-neutral copy keeps the runbook stable through the eventual selection. |
| D9 | `oracle-quarterly-review.md` automation | Ships as a manual checklist; Ansible re-apply playbook deferred to P22 (Copilot's PR-7 review hinted at this; logged in `oracle-deploy.md` Operational invariants) | Build Ansible playbook now | No second VM target yet; quarterly checklist is a sufficient MVP. |
| D10 | `scaling-up.md` forward references | Every section names the parent-plan todo id (e.g. "see P9c recipient-list-service") | Hard-coded names that drift on rename | Single source-of-truth — todos stay valid through renames; rule already documented in `.cursor/rules/`. |
| D11 | `oracle-deploy.md` §10 vs `oracle-quarterly-review.md` | Replace the inline checklist in `oracle-deploy.md` §10 with a one-line forward pointer; full checklist lives in the new file | Keep two copies | Avoids drift; the inline checklist was always a stub pointing forward to PR-8. |

## 3. Open questions (parked for follow-up PRs)

- **Q1**: PostHog self-host trigger for India DPDP — wait for first enterprise customer requirement, or pre-emptively stand up the EU → India migration ADR now? Recommend: defer to `scaling-up.md` as a "watch this" item; pre-emptive ADR at P21.
- **Q2**: Status page vendor (Statuspage.io / Better-Stack / Instatus) — pick one in `incident-response.md` or stay vendor-neutral? Recommend: vendor-neutral for PR-8; pick at P22 launch with the first paying customer onboarded.
- **Q3**: Quarterly restore drill cadence — true 90-day or align with Oracle quarterly review? Recommend: align (both on the same 90-day calendar to amortise context switch + cost).
- **Q4**: Ansible re-apply playbook for Oracle infra (Copilot's PR-7 review hinted at this) — ship as part of `oracle-quarterly-review.md` or defer to P22? Recommend: spec it out in the runbook (D9), build the playbook at P22 when there's a 2nd VM target.
- **Q5**: Atlas M0 → M10 trigger — pure storage (`free-tier-quota-burn.ts` already watches 0.5 GB) or also doc-count + Atlas Search index count (M0 caps both)? Recommend: add a doc-count + index-count check to the script in a follow-up PR (file `scripts/free-tier-quota-burn.ts` enhancement issue immediately after PR-8 merges).

## 4. Implementation checklist

- [x] `docs/runbooks/local-development.md` (NEW; ~150 lines)
- [x] `docs/runbooks/going-to-production.md` (~180 lines)
- [x] `docs/runbooks/scaling-up.md` (~200 lines)
- [x] `docs/runbooks/free-tier-burn.md` (~150 lines)
- [x] `docs/runbooks/incident-response.md` (~180 lines)
- [x] `docs/runbooks/backup-restore.md` (~180 lines)
- [x] `docs/runbooks/oracle-quarterly-review.md` (~150 lines) + tiny edit to `oracle-deploy.md` §10
- [x] `docs/runbooks/README.md` (NEW; ~60 lines) — runbooks index
- [x] `README.md` + `infrastructure/docker/README.md` cross-references
- [x] `pnpm dlx markdownlint-cli2` on the new files — 0 errors
- [ ] PR opened, Copilot review iterated, squash merged (in progress — Section 6 captures the final SHA)
- [ ] Status sync: project board + Epic #4 + Phase-Acceptance #5 + parent plan + this note (post-merge — Section 6 captures the trail)

## 5. Versions captured

PR-8 ships no code — there's no `pnpm ls` table for this PR. The runbooks reference external services' versions as of the dates above; future updates flow through the per-runbook citations.

## 6. Implementation reference

PR-8 landed via PR [#14](https://github.com/goldr0g3r/lotusgift/pull/14) — squash merge SHA [`4f1545e6`](https://github.com/goldr0g3r/lotusgift/commit/4f1545e61de5cc4f8c2ceab91bd6be63755a60fd).

| Metric | Value |
| --- | --- |
| Files changed (squashed) | 13 |
| Insertions (squashed) | +1,730 |
| Deletions (squashed) | -33 |
| Runbooks shipped | 7 (6 from parent plan + 1 `local-development.md`) |
| Runbooks index | 1 (`docs/runbooks/README.md`) |
| Cross-reference edits | 3 (`README.md` + `infrastructure/docker/README.md` + `oracle-deploy.md` §10) |
| Research notes | 1 (this file) |
| New CI jobs | 0 (docs-only) |
| Branch-protection contexts added | 0 |
| Final CI duration | 16 jobs, longest = `a11y` at 58s |
| Iterations (squashed) | 2 (initial 13-file commit + 7-file Copilot-review fix commit) |
| Copilot review comments addressed | 13 / 13 |

### Squashed commit timeline (chronological inside the PR)

1. `fe808de`/`8c1e2a8` — `docs(runbook)` initial 13-file commit (7 runbooks + index + 3 cross-refs + this research note + parent-plan in-progress flag).
2. `d4795b2` — `fix(runbook)` Copilot review pass: 13 separate issues addressed in a single commit (61 insertions, 42 deletions across 7 files).

Squash-merged into main as the single commit `4f1545e6`.

### Status-sync trail

- Project board [#9](https://github.com/users/goldr0g3r/projects/9): PR item added (`PVTI_lAHOB9XnOc4BXcKjzgsswU4`), fields set (Status=Done, Phase=P0, Workstream=docs, Layer=L0, Type=docs).
- Epic [#4](https://github.com/goldr0g3r/lotusgift/issues/4) — PR-8 line ticked with PR URL + squash SHA + 13-Copilot-fix summary. Issue closed (state_reason=completed) as part of the same status sync: all 8 Phase-0 PRs landed.
- Phase-Acceptance [#5](https://github.com/goldr0g3r/lotusgift/issues/5) — all 6 future-docs lines ticked + bonus line for `local-development.md` + runbooks index. Issue closed (state_reason=completed); all Phase-0 acceptance criteria met.
- Parent plan `.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md` — `p0-future-docs` todo marked completed with full attribution note.
- **Branch protection unchanged** — PR-8 added no new required-status-check contexts.
- `pr-8-future-docs` branch deleted local + remote.

### Followup parked items

- **Q1** (PostHog India DPDP self-host pre-emptive ADR) — open at P21 if no enterprise customer surfaces the requirement first.
- **Q2** (status-page vendor selection) — pick at P22 launch with the first paying customer.
- **Q4** (Ansible re-apply playbook for Oracle infra) — build at P22 when there's a 2nd VM target.
- **Q5** (Atlas doc-count + Atlas Search index-count checks in `scripts/free-tier-quota-burn.ts`) — file `chore(infra)` PR immediately after PR-8 lands (small script enhancement).
- Vercel `buildMinutes` + `functionDurationGbSec` quota checks in the script — currently TODO at lines 213+ of `scripts/free-tier-quota-burn.ts`.
- Cloudflare R2 storage + Class-A-operations quota check — currently manual; automate with the Cloudflare API at P22.

### Phase 0 closeout

PR-8 was the last Phase-0 PR. All 8 Phase-0 PRs landed; all infrastructure in place; all 9 runbooks shipped (github-setup + oracle-deploy from prior PRs + the 7 new from PR-8). Epic [#4](https://github.com/goldr0g3r/lotusgift/issues/4) + Phase-Acceptance [#5](https://github.com/goldr0g3r/lotusgift/issues/5) both closed.

Phase 1 (`@repo/typescript-config` + `@repo/eslint-config` + `@repo/jest-config` + `@repo/prettier-config` polish) is up next.
