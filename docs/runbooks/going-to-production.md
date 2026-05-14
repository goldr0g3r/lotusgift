# Going-to-production runbook

> Phase-22 launch playbook. Execute every checkbox in order; do not skip phases. Time-box: T-7 prep through T+7 review = 2 weeks of operator attention.

Prerequisites: every Phase-0..Phase-21 deliverable green per the [Phase-Acceptance issue #5](https://github.com/goldr0g3r/lotusgift/issues/5) (and the Phase-N acceptance issues for N = 1..21). At least one paying customer or pilot tenant identified. An on-call rotation defined (even single-operator MVP qualifies — see [`incident-response.md`](incident-response.md)).

The acceptance gate for launch is **OWASP ASVS 5.0 Level 2** (per [ASVS 5.0.0, retrieved 2026-05-14](https://asvs.dev/) — released May 2025 at Global AppSec EU Barcelona, replaces the long-obsolete v4.0.3). Level 2 = "recommended for apps holding sensitive data" — corporate-buyer-org KYC + Razorpay credentials + GST e-invoices all qualify.

---

## 1. Acceptance gate (must close before T-7)

- [ ] Phase-Acceptance [#5](https://github.com/goldr0g3r/lotusgift/issues/5) closed (all checkboxes ticked).
- [ ] Every later Phase-Acceptance issue (P1..P21) closed.
- [ ] OWASP ASVS 5.0 Level 2 self-audit complete; deviations logged in an ADR under `docs/architecture/`.
- [ ] SBOM generated (Syft / CycloneDX) and attached to the release tag.
- [ ] `pnpm dlx markdownlint-cli2 "**/*.md"` returns 0 errors against the launch SHA.
- [ ] `pnpm test` + `pnpm build` + `pnpm lint` + `pnpm check-types` + the full CI matrix green on `main` for 7 consecutive days.
- [ ] Zero open issues with label `prio/p0-critical`.

---

## 2. T-7 — provisioning (1 week before launch)

### Atlas

- [ ] Atlas storage usage from [`scripts/free-tier-quota-burn.ts`](../../scripts/free-tier-quota-burn.ts) — if > 70 %, run the M0 → M10 upgrade per [`scaling-up.md` §3](scaling-up.md#3-atlas-m0-m10-upgrade). M10 is `$0.08/hr` AWS Mumbai (~$57/month); board approval required.
- [ ] If staying on M0: cap `mongodump` cadence to ≤ 4× / day (see [`backup-restore.md` §3](backup-restore.md#3-atlas-m0-backup)) — M0 has no continuous backups (per [Atlas free-shared-limitations, 2026-05-14](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)).
- [ ] Atlas Network Access list updated: Oracle Mumbai VM IP only (no `0.0.0.0/0`).

### Vercel

- [ ] All 4 Next.js apps (`web-customer`, `web-vendor`, `web-admin`, `web-customer-service`) deployed to Vercel preview environments and green.
- [ ] Hobby → Pro flip (`https://vercel.com/<team>/settings/billing`). Hobby allows non-commercial use only; corporate gifting = commercial. Pro is `$20/user/month`. Required even before any traffic — license, not utilisation.
- [ ] Vercel project env vars audited: every `BETTER_AUTH_*`, `MONGO_URI`, `REDIS_URL`, `RAZORPAY_*`, `OTEL_*`, `SENTRY_DSN` set per environment (preview vs production), per the canonical list in [`infrastructure/oracle/.env.production.example`](../../infrastructure/oracle/.env.production.example).

### Razorpay

- [ ] Razorpay account KYC complete (PAN + Aadhaar + GSTIN + bank account verified) — typically takes 3-5 business days; start at T-14 if not already done.
- [ ] Webhook URL pointed at `https://api.lotusgift.com/api/payments/webhook` (per the nginx carve-out in [`infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf`](../../infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf)).
- [ ] Webhook secret rotated from test to live; pasted into `/opt/lotusgift/.env.production` as `RAZORPAY_WEBHOOK_SECRET`.
- [ ] Live `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` populated; test keys retired.

---

## 3. T-3 — credentials + infrastructure (3 days before launch)

### Carrier credentials

- [ ] Shiprocket account created; `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` populated.
- [ ] Delhivery production token populated (`DELHIVERY_API_TOKEN`).
- [ ] Bluedart credentials populated (`BLUEDART_API_KEY` + `BLUEDART_LICENSE_KEY`).
- [ ] Per-warehouse pickup origins registered in each carrier dashboard (matches `services/vendor-service` warehouse registry from P6).

### GHCR

- [ ] Container repo `ghcr.io/goldr0g3r/lotusgift-api` set to **Public** so the Oracle VM can pull without auth (lower-friction; the API itself is the security boundary).
- [ ] Retention policy on `ghcr.io/goldr0g3r/lotusgift-api`: keep last 50 untagged + every tagged release indefinitely (Settings → Package → Manage actions).

### Observability

- [ ] Sentry DSN populated in Vercel envs + `.env.production`.
- [ ] PostHog Cloud EU `POSTHOG_API_KEY` populated + first dashboard built (DAU + GMV + RFQ-conversion).
- [ ] Grafana Cloud Loki/Tempo/Prometheus credentials populated (`OTEL_EXPORTER_OTLP_ENDPOINT`).
- [ ] UptimeRobot HTTPS check on `https://api.lotusgift.com/healthz` (5-minute interval; free tier).

---

## 4. T-1 — DNS + final cutover prep (1 day before launch)

- [ ] DNS A/AAAA records for all 5 hostnames (`api.lotusgift.com` + 4 frontend subdomains) verified resolving to the right targets:

  ```bash
  for host in api app vendor admin cs; do
      dig +short "${host}.lotusgift.com"
  done
  ```

- [ ] Cloudflare proxy mode flip from **DNS only** to **Proxied** (orange cloud) for the 4 frontend hostnames. **Keep `api.lotusgift.com` as DNS only** until you've audited Razorpay's `X-Forwarded-For` trust list (deferred from PR-7 — Q2 in [`docs/research/phase-0-oracle-runbook.md`](../research/phase-0-oracle-runbook.md)).
- [ ] TLS posture validated: `curl -fsS -o /dev/null -w "%{http_code} %{ssl_verify_result}\n" https://api.lotusgift.com/healthz` returns `200 0`.
- [ ] Backup verified: trigger an out-of-band `mongodump` (see [`backup-restore.md` §3](backup-restore.md#3-atlas-m0-backup)) and confirm the dump appears in R2.
- [ ] All operators have working VPN access (if used) + SSH access to the Oracle VM + read access to Sentry/PostHog/Grafana.
- [ ] Slack `#incidents` channel created; on-call rotation per [`incident-response.md` §3](incident-response.md#3-rotation-and-escalation).

---

## 5. T-0 — cutover

1. **Announce go-live in `#incidents`.** Time-stamp the message.
2. **Verify api-gateway healthy.** `https://api.lotusgift.com/healthz` returns `{status: "ok", uptimeSec: N, timestamp: "..."}`.
3. **Smoke-matrix** — execute manually, one operator per row, time-stamp each row in `#incidents`:

   | App | Action | Acceptance |
   | --- | --- | --- |
   | `web-customer` | Browse catalogue, add to RFQ, submit | RFQ appears in `web-admin` queue |
   | `web-vendor` | Onboarding wizard, KYC submit | Pending approval row in `web-admin` |
   | `web-admin` | Approve vendor, list products | Product live on `web-customer` |
   | `web-customer` | Razorpay test order (using a real card for INR 1) | Webhook hit logged; refund issued same minute |
   | `web-customer-service` | Open ticket, escalate | Notification email landed in test inbox |
   | All 4 apps | Sign-in via Better-Auth (email/password + Google) | Session cookie set; cross-subdomain SSO works |

4. **Healthcheck assertions** (from the deploy `verify` job in `.github/workflows/deploy-oracle.yml`):

   ```bash
   ./infrastructure/oracle/scripts/healthcheck.sh   # 5-retry exponential back-off
   ```

5. **Flip the "soft launch" feature flag in PostHog** for the first batch of pilot customers (or `true` if launching to everyone).
6. **Mark complete in `#incidents`.** Capture the go-live commit SHA on `main` for the post-mortem timeline.

---

## 6. T+1 — incident watch (24h after launch)

- [ ] On-call operator dedicated; no other engineering work.
- [ ] Watch Sentry for new error volume — any new `[error]` series fires an immediate triage in `#incidents`.
- [ ] Watch UptimeRobot for any HTTPS / `/healthz` failures.
- [ ] Watch Grafana p95 latency; alert at > 500ms p95 sustained for 5 minutes.
- [ ] Watch Razorpay webhook delivery — any failed deliveries get a same-day investigation (signature mismatch usually = clock skew or rotation gap).
- [ ] Watch Atlas storage delta — first day of real traffic often spikes; if > 90 % of M0 quota, kick off the M10 upgrade ASAP.

If anything fires above SEV-3, follow [`incident-response.md`](incident-response.md).

---

## 7. T+7 — first quarterly review (1 week after launch)

- [ ] Execute the full checklist in [`oracle-quarterly-review.md`](oracle-quarterly-review.md). First execution = baseline; calibrate "normal" vs "alarming".
- [ ] First post-launch post-mortem (even if no SEV fired) — capture surprises, learnings, action-items.
- [ ] Rotate any first-week-issued secrets (Razorpay webhook secret + the seed admin password) — proves the rotation runbook works.
- [ ] Open an issue tagged `prio/p2-medium` against any deferred item from PR-8 open questions (PostHog India DPDP, status-page vendor, Ansible playbook).

---

## 8. Rollback trigger

Roll back to the pre-launch SHA via `infrastructure/oracle/scripts/rollback.sh` if ANY of:

1. SEV-1 declared (full outage > 5 minutes — see [`incident-response.md` §2](incident-response.md#2-severity-classification)).
2. Data integrity issue detected (any reconciliation failure on Razorpay payments or carrier shipments).
3. Sentry error volume > 50× the preview-environment baseline for 10 minutes.
4. p95 latency > 2 s sustained for 10 minutes.

Post-rollback: declare SEV-1, run the post-mortem template ([`incident-response.md` §6](incident-response.md#6-post-mortem-template)), file a recovery plan, only re-attempt launch after the recovery PRs merge.

---

## 9. Operational invariants

1. **Never launch on a Friday.** Always Mon-Wed so the on-call has full-team backup if SEV-1 fires.
2. **Never skip the SBOM step.** OWASP ASVS 5.0 V14 (Configuration) requires supply-chain provenance.
3. **Never paste live secrets into Slack / Linear / a Cursor chat.** Secrets live in Vercel envs + `/opt/lotusgift/.env.production` + GitHub Actions secrets — nowhere else.
4. **Never bypass the smoke matrix.** Even a 10-minute deploy gets the full 6-row matrix.
5. **Never raise the free-tier threshold without an ADR.** `scripts/free-tier-quota-burn.ts` defaults to 70 % per `.cursor/rules/free-tier-budget.mdc`; bumping it above 85 % requires a written rationale in `docs/architecture/`.

---

## Related runbooks

- [`docs/runbooks/incident-response.md`](incident-response.md) — what to do when something breaks during or after launch.
- [`docs/runbooks/scaling-up.md`](scaling-up.md) — quotas you'll hit first + how to upgrade out of them.
- [`docs/runbooks/backup-restore.md`](backup-restore.md) — RPO/RTO targets + restore-drill schedule.
- [`docs/runbooks/free-tier-burn.md`](free-tier-burn.md) — the weekly script that opens an issue when you cross 70 %.
- [`docs/runbooks/oracle-quarterly-review.md`](oracle-quarterly-review.md) — every 90 days post-launch.
