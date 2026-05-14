# Incident response runbook

> Severity classification + paging + comms + post-mortem template for LotusGift v2. Calibrated for a single-operator MVP that scales to a small team. Aligns with NIST SP 800-61 rev 3 lifecycle (Preparation / Detection / Response / Recovery / Improvement) without the full CSF 2.0 mapping (deferred to a P22 ADR).

The goal is **fast, calm, learning-oriented response**. Every SEV-1 ends in a post-mortem. Every post-mortem ends with action-items that become issues. No blameless culture without psychological safety baseline — blame the system, not the person.

---

## 1. Overview + SLOs

Pre-P22 SLO posture is **best-effort** (no contractual SLA). Internal targets:

| Metric | Target |
| --- | --- |
| `https://api.lotusgift.com/healthz` availability | 99 % monthly |
| p95 API latency | < 500 ms |
| p99 API latency | < 2 s |
| Razorpay webhook delivery success | > 99.5 % |
| Restore from backup (RTO) | < 4 h (per [`backup-restore.md`](backup-restore.md)) |
| Data loss window (RPO) | < 24 h (M0); < 5 min once on M10 |

These tighten at P22 launch when paying customers exist and contractual SLAs apply.

---

## 2. Severity classification

LotusGift uses 3 SEV levels for MVP single-operator. Maps to RFC 5424 syslog severities 3 / 4 / 5 (per [RFC 5424 §6.2.1](https://datatracker.ietf.org/doc/html/rfc5424#section-6.2.1)). A SEV-0 / "catastrophic" tier lands when there are > 5 operators on call.

| SEV | Definition | Examples | Response time | Comms |
| --- | --- | --- | --- | --- |
| **SEV-1** | Full outage OR data integrity issue | api.lotusgift.com returns 5xx > 50 % for > 5 min; Mongo cluster down; reconciliation failure on Razorpay payments; mass data corruption | Page on-call within 5 min | Customer-facing status update within 30 min |
| **SEV-2** | Degraded service OR single-region failure | p95 latency > 2 s sustained 15 min; Razorpay webhook delivery failing for one merchant; single vendor's product catalogue not loading | Page on-call within 15 min | Internal Slack only unless > 60 min |
| **SEV-3** | Single-feature broken; workaround exists | Customization mockup upload failing; one carrier API down; one report not rendering | Triage within 4 h | Issue tracker only |

**No SEV-0 in MVP.** Single-operator on-call means escalation = founder direct; tiering above SEV-1 doesn't help.

---

## 3. Rotation and escalation

**MVP** — single-operator on-call:

- Primary: whoever is closest to the change (PR author for the recent deploy, otherwise the rotating week's operator).
- Escalation: founder. Direct phone number in the private team password manager (NOT in this runbook).
- Backup: secondary operator (introduced at second hire); current MVP fallback = pause customer-facing apps via Vercel deployment toggle and respond when daylight permits if outside SEV-1/2.

**Post-launch** (P22+) — formal rotation:

- Weekly rotation; handover Monday 09:00 IST.
- Primary + secondary; secondary pages if primary doesn't acknowledge within 5 min for SEV-1, 15 min for SEV-2.
- Out-of-hours coverage = full 24/7 once headcount allows; until then, T+8 hours business-day response for SEV-2/3 is documented in the public status page.

**On-call gear:**

- Slack mobile app + push notifications enabled
- GitHub mobile app for issue notifications
- Sentry mobile app + alerts
- Atlas + Vercel + Cloudflare consoles bookmarked
- VPN credentials cached
- SSH key to the Oracle VM available offline

---

## 4. Detection sources

| Source | Fires on |
| --- | --- |
| UptimeRobot HTTPS check (5-min interval) | `/healthz` 5xx for 2 consecutive checks |
| Sentry | New issue OR existing issue volume > 5× baseline |
| PostHog | DAU drop > 30 % vs same hour previous day; conversion-funnel drop > 50 % |
| Atlas | Cluster status != HEALTHY; storage > 95 % |
| Vercel | Deployment failure on `main`; bandwidth > 95 % |
| Customer report | Email to support@ / Slack DM / WhatsApp |

All of these page the on-call into `#incidents` Slack. Customer reports get rerouted there manually by whoever sees them first.

---

## 5. Response procedure

The first 15 minutes matter most. Do these in order:

1. **Acknowledge in `#incidents`.** Format: `ack <SEV-N> — <one-line description> — started at <ISO timestamp>`. Time-stamp every status update.
2. **Stop the bleeding.** If you can rollback (`./infrastructure/oracle/scripts/rollback.sh`) safely and the last-known-good tag is recent, do it. If a feature flag can disable the offending feature, flip it. Don't debug a live SEV-1; investigate a stable system.
3. **Communicate.** SEV-1: post to the status page within 30 min (vendor-neutral copy template in §7). SEV-2: internal Slack. SEV-3: issue tracker entry.
4. **Investigate root cause.** Use the runbook crosslinks in §6 by failure mode. Capture every command + output in `#incidents` so the post-mortem timeline writes itself.
5. **Verify resolution.** Smoke-test the smoke matrix from [`going-to-production.md` §5](going-to-production.md#5-t-0-cutover). Watch metrics for 30 min before declaring all-clear.
6. **Declare all-clear.** Format: `all-clear <SEV-N> — <one-line summary> — resolved at <ISO> — duration <N min>`.

---

## 6. Runbook crosslinks per failure mode

| Failure | First action | Runbook |
| --- | --- | --- |
| api.lotusgift.com 5xx | Check api-gateway logs on Oracle VM; `systemctl status lotusgift-api` | [`oracle-deploy.md` §9](oracle-deploy.md#9-operational-recipes-rollback-scale-restart-logs-cert-cleanup) |
| Mongo cluster down | Check Atlas console status; check Network Access list for IP changes | [`scaling-up.md` §3](scaling-up.md#3-atlas-m0-m10-upgrade) (upgrade if storage breached) |
| Razorpay webhook signature failures | Verify clock skew (`timedatectl status` on VM); verify webhook secret rotation; check `proxy_request_buffering off` per [`oracle-deploy.md`](oracle-deploy.md) nginx config | payment-service P10 (when it lands) |
| nginx 502 to api-gateway | `docker ps` on the VM to confirm container alive; `docker logs lotusgift-api-gateway` | [`oracle-deploy.md` §9](oracle-deploy.md#9-operational-recipes-rollback-scale-restart-logs-cert-cleanup) |
| nginx cert expiry | `sudo certbot certificates` to check; `sudo certbot renew --force-renewal` if needed | [`oracle-deploy.md` §9](oracle-deploy.md#9-operational-recipes-rollback-scale-restart-logs-cert-cleanup) |
| Oracle VM reclaimed (Always Free idle) | Stand up new VM from [`oracle-deploy.md`](oracle-deploy.md) Sections 1-8; state lives in Atlas + Upstash + R2 so data survives | [`oracle-deploy.md` §9 reprovision-from-scratch](oracle-deploy.md#reprovision-from-scratch-oracle-reclaimed-the-vm) |
| Upstash Redis down | Confirm at Upstash console; failover = read from Mongo cache fallback (P5 wires this in) | [`scaling-up.md` §7](scaling-up.md#7-upstash-redis-self-hosted-redis-on-the-oracle-vm) |
| Carrier API down (Shiprocket / Delhivery / Bluedart) | Auto-route to fallback carrier per shipping-service P11 logic; comms to affected vendors | shipping-service P11 (when it lands) |
| Suspected breach (auth bypass / data leak) | Immediately rotate `BETTER_AUTH_SECRET` + all Razorpay keys + Atlas password; revoke all Better-Auth sessions via Admin plugin; force-rotate SSH key | (security ADR, P22) |

---

## 7. Comms templates

### Status page (vendor-neutral)

```text
Investigating — YYYY-MM-DD HH:MM UTC — We're investigating reports of [brief description, customer-facing language only — no internal jargon]. Our team is on it; we'll post the next update within [N] minutes.

Identified — YYYY-MM-DD HH:MM UTC — We've identified the cause as [high-level cause; no proprietary detail]. We're rolling out a fix; estimated resolution in [N] minutes.

Monitoring — YYYY-MM-DD HH:MM UTC — A fix has been deployed. We're monitoring for stability before declaring all-clear.

Resolved — YYYY-MM-DD HH:MM UTC — Service is fully restored. Full duration: [N] minutes. We'll publish a post-mortem within [3 working days for SEV-1, 7 for SEV-2].
```

### Customer email (SEV-1 affecting > 10 % of customers)

> Subject: \[LotusGift\] Service incident on \<date\>
>
> Hi \<name\>,
>
> Earlier today between \<start\> and \<end\>, you may have noticed \[symptom\]. We've identified the cause as \[high-level\] and resolved it at \<resolution time\>.
>
> Your data is safe. \[Specific reassurance based on the failure mode.\]
>
> We're publishing a post-mortem at \[link\] within 3 business days. If you saw an error and want help confirming nothing got lost, reply to this email and we'll dig in.
>
> – The LotusGift team

### Internal Slack (SEV-1 declaration)

> :rotating_light: **SEV-1 declared** — \<one-line description\> — page primary on-call \<@user\> — investigating in \<thread>

---

## 8. Post-mortem template

Every SEV-1 gets one within 3 business days. SEV-2 within 7. SEV-3 only if recurring (3+ in a quarter).

Save to `docs/post-mortems/YYYY-MM-DD-<slug>.md` (folder created on the first post-mortem).

```markdown
# Post-mortem: <one-line description>

**Date:** YYYY-MM-DD
**Severity:** SEV-N
**Duration:** N minutes
**Author:** <name>
**Reviewed:** <names>

## Summary

One paragraph: what broke, who was affected, how long, how it was fixed.

## Timeline (UTC)

| Time | Event |
| --- | --- |
| HH:MM | Detection: <how> |
| HH:MM | Ack: <who> |
| HH:MM | Identified: <cause> |
| HH:MM | Mitigation: <action> |
| HH:MM | All clear |

## Root cause (5-whys)

1. Why did the system fail? <answer>
2. Why <answer-1>? <answer>
3. Why <answer-2>? <answer>
4. Why <answer-3>? <answer>
5. Why <answer-4>? <answer>

## What went well

- <bullet>
- <bullet>

## What went poorly

- <bullet>
- <bullet>

## Action items

| # | Action | Owner | Due | Issue |
| --- | --- | --- | --- | --- |
| 1 | <action> | <owner> | YYYY-MM-DD | #<issue> |

## Lessons learned

One paragraph capturing the durable insight that should change how we build / operate going forward.
```

---

## 9. Operational invariants

1. **Every SEV-1 gets a post-mortem within 3 business days.** No exceptions.
2. **Every action item becomes a GitHub issue** before the post-mortem is published. No "TODO" lists in markdown without a tracker entry.
3. **Don't debug a live SEV-1.** Rollback first, debug in staging from the saved logs.
4. **Time-stamp every status update.** A 5-line incident transcript with timestamps beats a 50-line summary with none.
5. **Comms over silence.** Customers tolerate outages; they don't tolerate radio silence. 30-min cadence even when there's "nothing new to report".
6. **Blameless retrospectives.** Blame the system; never the person. If a single individual failure caused it, ask why the system allowed that failure mode.
7. **Don't escalate via DM.** Use `#incidents`. A thread that becomes the post-mortem timeline writes itself.

---

## Related runbooks

- [`docs/runbooks/oracle-deploy.md`](oracle-deploy.md) — rollback, restart, log inspection recipes.
- [`docs/runbooks/backup-restore.md`](backup-restore.md) — restore drill + recovery procedure.
- [`docs/runbooks/going-to-production.md`](going-to-production.md) — pre-launch smoke matrix the recovery procedure re-runs.
- [`docs/runbooks/scaling-up.md`](scaling-up.md) — if the incident was a capacity issue, the upgrade path.
- NIST SP 800-61 rev 3 — [official PDF](https://csrc.nist.gov/pubs/sp/800/61/r3/final), April 2025. Full CSF 2.0 mapping deferred to a P22 ADR.
