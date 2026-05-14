# Oracle quarterly review runbook

> Run every 90 days post-Oracle-VM-provisioning. Catches cert expiry, audit-drift, fail2ban hot-spots, billing creep, and SSH key staleness before they become incidents. Replaces the inline checklist in [`oracle-deploy.md` §10](oracle-deploy.md#10-quarterly-review-checklist) (which now forward-points here).

Time-box: ~45 minutes of operator attention per review. Combine with the restore drill from [`backup-restore.md` §8](backup-restore.md#8-quarterly-restore-drill) so context-switch is amortised across both.

---

## 1. Schedule + cadence

| Quarter | Target date | Operator | Notes |
| --- | --- | --- | --- |
| Q1 | Last week of March | rotating | post-fiscal-year start |
| Q2 | Last week of June | rotating | mid-year |
| Q3 | Last week of September | rotating | pre-holiday-traffic |
| Q4 | Last week of December | rotating | year-end audit baseline |

Open a calendar event repeating every 90 days. The first execution happens at T+7 post-launch per [`going-to-production.md` §7](going-to-production.md#7-t7-first-quarterly-review-1-week-after-launch).

---

## 2. Certificate renewal validation

Let's Encrypt certs auto-renew via the `snap.certbot.renew.timer` per [`oracle-deploy.md` §9](oracle-deploy.md#9-operational-recipes-rollback-scale-restart-logs-cert-cleanup). Verify the renewal pipeline is healthy:

```bash
# SSH into the Oracle VM as the deploy user.
ssh ubuntu@<vm-ip>

# Dry-run renewal — must succeed; this exercises the entire pipeline without
# actually renewing.
sudo certbot renew --dry-run

# Inspect the current cert expiry — must be > 30 days out.
sudo certbot certificates | grep -i "expiry"

# Confirm the renewal timer is active + next-run timestamp.
systemctl list-timers snap.certbot.renew.timer --no-pager

# Inspect the last 10 renewal log lines.
sudo journalctl -u snap.certbot.renew -n 20
```

If `--dry-run` fails: open a SEV-3 issue + investigate before the cert expires. Common causes: UFW blocked :80 (Certbot HTTP-01 challenge needs it), nginx config syntax error, ACME rate limit hit.

---

## 3. Audit-drift diff

Re-run every diff from [`infrastructure/oracle/README.md` §Audit-drift detection](../../infrastructure/oracle/README.md#audit-drift-detection). All 14 commands MUST return empty:

```bash
# Replicating the README block for at-a-glance — see the source for the full list.
sudo diff <(sed 's/${LOTUSGIFT_API_HOST}/api.lotusgift.com/g' \
             infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf) \
          /etc/nginx/sites-available/api.lotusgift.com.conf

sudo diff infrastructure/oracle/nginx/nginx.conf            /etc/nginx/nginx.conf
sudo diff infrastructure/oracle/nginx/snippets/ssl.conf     /etc/nginx/snippets/ssl.conf
# ... + 11 more diffs across nginx snippets / systemd / fail2ban / sshd / logrotate / scripts / compose.
```

Any diff with content = drift. Common drift causes:

- Distro patch nudged a config (e.g. Ubuntu HWE bump rewrote `/etc/nginx/nginx.conf`).
- Operator hot-fix that wasn't backported to the repo.
- An apt upgrade brought in a new `dpkg --conf-old` resolution.

**Resolution:** PR the on-host change back into the repo (if intentional) OR re-install the repo version (if accidental):

```bash
sudo install -m 0644 infrastructure/oracle/nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

Then re-run the diff to confirm empty.

---

## 4. fail2ban audit

```bash
# Active jails + ban-count per jail.
sudo fail2ban-client status

# Per-jail detail (do for each jail listed).
sudo fail2ban-client status sshd
sudo fail2ban-client status nginx-limit-req
sudo fail2ban-client status nginx-badbots
sudo fail2ban-client status nginx-noscript
```

Acceptance:

- sshd ban-count > 50 over 90 days → investigate (likely scripted brute-force; consider tightening `maxretry` from 3 to 2 or moving SSH to a non-standard port).
- nginx-limit-req ban-count > 10 over 90 days → audit the `limit_req_zone` rate (20 r/s in [`infrastructure/oracle/nginx/nginx.conf`](../../infrastructure/oracle/nginx/nginx.conf)); may need tightening.
- Any banned IP showing up > 5 times over 90 days → add to permanent `iptables` deny or open an ASN-block ADR.

---

## 5. Oracle billing dashboard

```text
Oracle Cloud Console → Billing → Cost Analysis → last 90 days
```

Acceptance:

- All Always Free resource usage at < 90 % of free-tier cap (refer to `scripts/free-tier-quota-burn.ts` for the current thresholds — Oracle SDK auth still manual until P22).
- Zero billable items. If any: file a SEV-2 — usually means an OCPU-hour or block-storage spillover that needs cleaning up.
- VM uptime > 99 % over 90 days. < 99 % implies idle-reclaim is happening despite the heartbeat — investigate the heartbeat timer (`systemctl list-timers lotusgift-heartbeat.timer`).

---

## 6. SSH key rotation

```bash
# When was the current CI SSH key issued?
# Check the repo secret 'ORACLE_SSH_KEY' creation date on GitHub:
gh api repos/goldr0g3r/lotusgift/actions/secrets/ORACLE_SSH_KEY --jq '.created_at'
```

If > 90 days old:

1. Generate a new key on your workstation: `ssh-keygen -t ed25519 -f ~/.ssh/lotusgift-ci-Q<N> -C "github-actions@lotusgift Q<N> YYYY"`.
2. Append the new `.pub` to `/home/ubuntu/.ssh/authorized_keys` on the VM.
3. Test: `ssh -i ~/.ssh/lotusgift-ci-Q<N> ubuntu@<vm-ip> 'whoami'`.
4. Update the `ORACLE_SSH_KEY` repo secret with the new private key.
5. Trigger a manual `workflow_dispatch` on `.github/workflows/deploy-oracle.yml` to validate the new key works end-to-end.
6. Remove the old key from `authorized_keys`. Confirm via a denied login attempt with the old key.

---

## 7. Image cache hygiene

```bash
# Docker disk usage.
docker system df -v

# Prune images older than 30 days (720 hours).
docker image prune -f --filter "until=720h"

# Confirm /var/lib/docker stayed within reasonable bounds (< 10 GB on a 50 GB
# boot volume).
sudo du -sh /var/lib/docker
```

The `deploy.sh` script also prunes on every successful deploy (24h filter); this is the safety net for slow-deploy weeks.

---

## 8. Heartbeat health

```bash
# Confirm the timer + service are alive.
systemctl list-timers lotusgift-heartbeat.timer --no-pager
sudo systemctl status lotusgift-heartbeat.service --no-pager

# Sample the last 7 days of heartbeat log lines.
sudo tail -50 /var/log/lotusgift/heartbeat.log

# Confirm logrotate is doing its job (file should be < 100 KB).
sudo ls -lh /var/log/lotusgift/heartbeat.log*
```

Acceptance: at least 4 heartbeat events per 24 hours (every 6 hours per the `OnCalendar=*-*-* 00/6:00:00` timer).

---

## 9. Capture findings

Document the review outcome at `docs/quarterly-reviews/YYYY-QN.md` (folder created on the first review):

```markdown
# Quarterly review YYYY-QN

**Reviewer:** <name>
**Date:** YYYY-MM-DD
**Time spent:** ~N minutes

## Cert renewal

- Dry-run: PASS / FAIL (notes)
- Expiry: YYYY-MM-DD

## Audit-drift

- Empty diffs: 14 / 14 / N/M with details

## fail2ban

- sshd bans: N over 90 days (notes)
- nginx-limit-req bans: N
- IPs banned > 5×: <list>

## Billing

- Free-tier usage: <percentages>
- Billable items: <list or "none">
- VM uptime: NN.N%

## SSH key rotation

- Last rotation: YYYY-MM-DD
- Rotated this review: YES / NO

## Docker hygiene

- /var/lib/docker size: N GB
- Pruned: YES / NO

## Heartbeat

- Events / 24 h: N
- Log size: NN KB

## Action items

| # | Item | Owner | Due | Issue |
| --- | --- | --- | --- | --- |
| 1 | ... | | | |

## Next review

YYYY-MM-DD
```

---

## 10. Forward to automation

This runbook is a manual checklist for the MVP. At P22 we automate the re-apply step via an Ansible playbook (Copilot's PR-7 review hinted at this; D9 + Q4 in [`docs/research/phase-0-future-docs.md`](../research/phase-0-future-docs.md)). The playbook will:

- Run all 14 audit-drift diffs and auto-PR any drift correction.
- Verify cert expiry programmatically.
- Auto-prune Docker.
- Send a summary to `#incidents`.

The manual checklist will remain as a fallback + onboarding tool.

---

## 11. Operational invariants

1. **Run every 90 days.** Slipping > 30 days past schedule = SEV-3 issue auto-filed (manual today; automated at P22).
2. **Document findings in the per-quarter file** — no oral tradition.
3. **Every action item becomes an issue** before the review file is committed.
4. **Combine with the restore drill** from [`backup-restore.md` §8](backup-restore.md#8-quarterly-restore-drill) — amortise context-switch.
5. **The repo is source-of-truth.** Any drift gets pushed back to the repo (or re-installed from the repo).

---

## Related runbooks

- [`docs/runbooks/oracle-deploy.md`](oracle-deploy.md) — initial provision + operational recipes referenced here.
- [`docs/runbooks/backup-restore.md`](backup-restore.md) — restore drill aligned with this 90-day cadence.
- [`docs/runbooks/incident-response.md`](incident-response.md) — what to do when an audit finds something that fires a SEV.
- [`docs/runbooks/free-tier-burn.md`](free-tier-burn.md) — refresh the quota table here.
- [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md) — canonical audit-drift command list.
