# Backup and restore runbook

> Backup procedures for every piece of LotusGift v2 production state (Atlas Mongo + Upstash Redis + Cloudflare R2 + the GitHub-hosted code). Quarterly restore-drill schedule. RPO 24 h / RTO 4 h while on M0; tightens to RPO < 5 min once on M10.

This runbook is a **spec** — it documents what the backup jobs MUST do. Concrete `mongodump` cron + Upstash RDB export jobs land alongside `@repo/database` (P3) and `services/auth-service` (P5). The spec gates them; the implementation just satisfies the spec.

---

## 1. Overview

| Data | Hosted by | Backup mechanism | Free-tier-compatible |
| --- | --- | --- | --- |
| Mongo collections (everything app-state) | MongoDB Atlas M0 (AWS Mumbai) | Manual `mongodump` → R2 (M0 has no continuous backups per [Atlas free-shared-limitations](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/), 2026-05-14) | Yes |
| Redis sessions + rate-limit counters + idempotency keys | Upstash Redis (AWS Mumbai) | Manual `--rdb` export → R2 (per [Upstash backup docs](https://upstash.com/docs/redis/howto/importexport), 2026-05-14) | Yes |
| Catalogue images + customization art files + invoices | Cloudflare R2 | Bucket versioning + 30-day lifecycle to Infrequent Access; cross-bucket replication to a separate R2 bucket for catastrophic recovery | Yes (within 10 GB free) |
| Code | GitHub (`goldr0g3r/lotusgift`) | Git history is the backup | Yes |
| Secrets | Vercel env vars + Oracle VM `/opt/lotusgift/.env.production` + GitHub Actions secrets | NOT backed up — rotation procedure exists in [`going-to-production.md` §8](going-to-production.md#8-rollback-trigger); secrets manager (1Password / Bitwarden) holds the canonical copy | n/a |

---

## 2. RPO / RTO targets

| Tier | RPO (data loss window) | RTO (time to restore) | Notes |
| --- | --- | --- | --- |
| Atlas M0 | 24 h | 4 h | Daily `mongodump` cron; restore = download archive + `mongorestore` into a fresh M0 |
| Atlas M10+ | < 5 min | < 1 h | Atlas continuous backup + point-in-time restore |
| Upstash Redis | 24 h | 1 h | Daily RDB export; Redis state is mostly ephemeral (sessions, rate limits) — RPO is intentionally loose |
| R2 | 0 (versioning) | 5 min | Object versioning is per-PUT; restore = revert to prior version |
| Code | 0 | 5 min | Git history; restore = `git checkout <SHA>` |

Targets tighten at P22 once on M10. Pre-launch posture intentionally loose to stay on free tier.

---

## 3. Atlas M0 backup (mongodump)

M0 free clusters have NO automatic backup feature (per [Atlas free-shared-limitations, 2026-05-14](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)). We run a manual `mongodump` 4× / day from a GitHub Actions cron and ship the dump to R2.

### Spec (implemented at P3)

The cron job MUST:

1. Run on a `*/6 * * * *` schedule (every 6 hours; ≤ 4× / day).
2. Use `mongodump --uri "${MONGO_BACKUP_URI}" --gzip --archive=/tmp/lotusgift-${ISO_TIMESTAMP}.gz` against a read-only Atlas user (NOT the app's R/W user — separate principal of least privilege).
3. Upload to R2 at `s3://lotusgift-backups/atlas/lotusgift-${ISO_TIMESTAMP}.gz` (Cloudflare R2 supports S3 API).
4. Verify the upload via `aws s3api head-object` (R2 S3-compat endpoint).
5. Delete the local file from the runner.
6. Emit a status line to the GitHub Actions summary.
7. On failure, page via `#incidents` (treat as SEV-2; backup gap > 12 h escalates to SEV-1).

The R2 bucket `lotusgift-backups` has a 30-day Infrequent Access lifecycle rule (per [R2 lifecycle docs, 2026-05-14](https://developers.cloudflare.com/r2/buckets/object-lifecycles)) and a Bucket Lock (per [R2 bucket locks, March 2025](https://developers.cloudflare.com/r2/buckets/bucket-locks)) preventing deletion for the first 30 days.

### Restore procedure

```bash
# Download the most recent dump.
aws --endpoint-url https://<account>.r2.cloudflarestorage.com s3 cp \
    s3://lotusgift-backups/atlas/lotusgift-<ISO_TIMESTAMP>.gz \
    /tmp/restore.gz

# Stand up a fresh M0 cluster in the Atlas console (or restore over the
# existing one if data corruption is confirmed and you have explicit go-ahead).
# Capture the new connection URI.

mongorestore --uri "<NEW_M0_URI>" --gzip --archive=/tmp/restore.gz --drop

# Validate.
mongosh "<NEW_M0_URI>" --eval "db.adminCommand({ ping: 1 })"
mongosh "<NEW_M0_URI>" --eval "db.getSiblingDB('lotusgift').getCollectionNames()"

# Repoint apps via env var (Vercel + Oracle VM .env.production).
# Verify smoke matrix from going-to-production.md §5.
```

> **Operational invariant.** NEVER `mongorestore` over the production database without explicit go-ahead in `#incidents` + a 5-minute "are you sure?" pause. The `--drop` flag drops collections; recovery from a wrong-day dump = lose hours of data.

---

## 4. Upstash Redis backup (RDB export)

Upstash free tier supports manual RDB export from the dashboard, but provides no native cron. We script it ourselves via the Upstash Management API.

### Spec (implemented at P5)

1. Run on a `0 6 * * *` schedule (daily 06:00 UTC = ~11:30 IST).
2. Hit `POST https://api.upstash.com/v2/redis/database/<id>/export` to trigger an RDB export.
3. Poll the export status until complete (typical: < 60 s for free-tier 256 MB cap).
4. Download the RDB file.
5. Upload to R2 at `s3://lotusgift-backups/redis/lotusgift-${ISO_TIMESTAMP}.rdb`.
6. Same lifecycle + bucket lock as Atlas backups.

> Redis Functions data is NOT preserved in RDB exports (per [Upstash docs](https://upstash.com/docs/redis/howto/importexport)). We don't use Functions today, but if P5 introduces them, document them separately + back up by other means.

### Restore procedure

```bash
# Download the most recent dump.
aws --endpoint-url https://<account>.r2.cloudflarestorage.com s3 cp \
    s3://lotusgift-backups/redis/lotusgift-<ISO_TIMESTAMP>.rdb \
    /tmp/restore.rdb

# Provision a fresh Upstash database; capture connection URL.
# Use redis-cli --pipe to import.
redis-cli -h <NEW_HOST> -p <NEW_PORT> --tls --pipe < /tmp/restore.rdb

# Validate.
redis-cli -h <NEW_HOST> -p <NEW_PORT> --tls dbsize
```

Most Redis state (sessions, rate-limit counters, idempotency cache) is benign-to-lose. Restore is for catastrophic loss only.

---

## 5. Cloudflare R2 backup (object versioning + replication)

R2 versioning is enabled per-bucket; every PUT to an existing key creates a new version, old versions are retrievable for 30 days (via lifecycle rule). Restore = `aws s3api list-object-versions` + `aws s3api copy-object` to the desired version.

For catastrophic recovery (entire R2 region down or account compromise), we replicate the `lotusgift-catalog` + `lotusgift-customization` buckets to a separate R2 account in a different geographic region. Trigger = manual on quarterly drill OR if Cloudflare announces > 24h regional outage.

The `lotusgift-backups` bucket itself (holding Atlas + Upstash dumps) ALSO gets cross-account replication — losing both at once = catastrophic.

---

## 6. Code backup

Git history at `https://github.com/goldr0g3r/lotusgift` IS the backup. If GitHub goes catastrophically down (or the account is compromised), every contributor's clone is a complete backup — `git push --mirror` to a Codeberg / GitLab mirror once + sync weekly.

Action: open a `prio/p2-medium` issue at T+7 launch (per [`going-to-production.md` §7](going-to-production.md#7-t7-first-quarterly-review-1-week-after-launch)) to set up the mirror.

---

## 7. Encryption at rest

| Data | Encryption | Verified by |
| --- | --- | --- |
| Atlas Mongo | AES-256 default ([Atlas default-encryption docs](https://www.mongodb.com/docs/atlas/security-vault/)) | Atlas console → Security → Advanced |
| Upstash Redis | TLS-in-transit (`rediss://`) + AES-256 at rest | Upstash console → Database → Security |
| Cloudflare R2 | AES-256 default | R2 docs — automatic for every bucket |
| `lotusgift-backups` R2 bucket | AES-256 default; optionally SSE-KMS with our own KMS key at P22 (Cloudflare R2 supports SSE-C from Q2 2025) | manual quarterly verification |

No customer-managed encryption keys (CMEK) at MVP. Add at P22 if any enterprise customer requires it.

---

## 8. Quarterly restore drill

Every 90 days (aligned with [`oracle-quarterly-review.md`](oracle-quarterly-review.md) per Q3 in the [research note](../research/phase-0-future-docs.md#3-open-questions)):

- [ ] Pick the most recent Atlas dump from R2.
- [ ] Restore to a separate Atlas project (NOT the production cluster).
- [ ] Run the smoke matrix from [`going-to-production.md` §5](going-to-production.md#5-t-0-cutover) against the restored cluster.
- [ ] Time the end-to-end procedure — must be < RTO (4 h on M0; 1 h on M10).
- [ ] Pick the most recent Upstash RDB from R2; restore into a fresh Upstash DB; run a sample auth flow.
- [ ] Pick a recently-uploaded customization art file from R2; restore from a prior version.
- [ ] Capture timings + any drift from the spec in the quarterly review checklist.
- [ ] If RTO > target, open a `prio/p1-high` issue to investigate.
- [ ] Tear down the test Atlas project to avoid stale free-tier consumption.

---

## 9. Operational invariants

1. **Never restore over production without explicit confirmation** in `#incidents` + a 5-minute pause. Use a separate cluster / DB / bucket for restore drills.
2. **Backups have a separate Atlas user with read-only access.** Never give the app's R/W user backup permissions.
3. **Bucket Lock is enforced** on `lotusgift-backups` for 30 days. Recoverability over disk-cost.
4. **Restore drills run quarterly** — a backup that hasn't been tested isn't a backup.
5. **RPO/RTO drift opens a `prio/p1-high` issue** within 7 days.
6. **Never disable a backup cron** without filing an ADR + a replacement.
7. **Validate every backup upload** via head-object check; a silent failure is worse than no backup.

---

## Related runbooks

- [`docs/runbooks/incident-response.md`](incident-response.md) — when to invoke the restore procedure.
- [`docs/runbooks/oracle-quarterly-review.md`](oracle-quarterly-review.md) — drill cadence aligned here.
- [`docs/runbooks/scaling-up.md`](scaling-up.md) — M0 → M10 unlocks continuous backup; this runbook updates at that point.
- [`docs/runbooks/going-to-production.md`](going-to-production.md) — pre-launch backup verification.
- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — P3 (`@repo/database`) is where the backup cron job code lands.
