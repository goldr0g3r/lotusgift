# LotusGift v2 runbooks

> Index of operational runbooks. Grouped by lifecycle phase. Each entry has a one-line summary + estimated time to execute end-to-end.

For the architecture context, start at the parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md).

---

## Bootstrap (run once per environment)

| Runbook | When | Time |
| --- | --- | --- |
| [`github-setup.md`](github-setup.md) | Fresh contributor or recreated repo. Flips visibility public, provisions PAT, sets up Projects v2 board, milestones + labels, branch protection. | ~15 min |
| [`local-development.md`](local-development.md) | Fresh contributor workstation. Host-install Mongo + Redis (preferred) or docker compose (fallback). | ~15 min |
| [`oracle-deploy.md`](oracle-deploy.md) | Fresh Oracle Always Free A1.Flex VM. End-to-end provisioning + nginx + Certbot + systemd + first deploy + GitHub Actions wire-up. | ~60 min |

## Daily operations

| Runbook | When | Time |
| --- | --- | --- |
| [`incident-response.md`](incident-response.md) | Anything fires above SEV-3. SEV classification + paging + comms templates + post-mortem template. | response-time-bound |
| [`free-tier-burn.md`](free-tier-burn.md) | Weekly cron emits a `prio/p1-high` issue at > 70 % free-tier consumption. Per-vendor quota table + threshold response procedure. | ~10 min per issue |

## Launch

| Runbook | When | Time |
| --- | --- | --- |
| [`going-to-production.md`](going-to-production.md) | P22 launch + every subsequent major-version GA. T-7 → T+7 checklist; OWASP ASVS 5.0 Level 2 acceptance gate. | 2 weeks operator attention |

## Scaling

| Runbook | When | Time |
| --- | --- | --- |
| [`scaling-up.md`](scaling-up.md) | A `free-tier-burn` issue or capacity alarm fires. Per-axis upgrade paths: microservice split, Atlas M0 → M10, PostHog self-host, RN vs native, FBA-style warehouses, Upstash → self-hosted Redis. | varies per axis |

## Recovery

| Runbook | When | Time |
| --- | --- | --- |
| [`backup-restore.md`](backup-restore.md) | Restore drill (quarterly) OR catastrophic recovery. Atlas mongodump + Upstash RDB + R2 versioning + cross-account replication. RPO 24h / RTO 4h on M0. | ~30 min drill / ~4 h catastrophic |

## Quarterly

| Runbook | When | Time |
| --- | --- | --- |
| [`oracle-quarterly-review.md`](oracle-quarterly-review.md) | Every 90 days. Cert renewal validation + audit-drift diff (14 commands) + fail2ban audit + Oracle billing review + SSH key rotation + Docker hygiene + heartbeat health. | ~45 min |

---

## Quick links

- [`infrastructure/oracle/README.md`](../../infrastructure/oracle/README.md) — Oracle VM file-tree map + audit-drift commands referenced from `oracle-deploy.md` + `oracle-quarterly-review.md`.
- [`infrastructure/docker/README.md`](../../infrastructure/docker/README.md) — Docker compose fallback for `local-development.md` Section 5.
- [`infrastructure/github/README.md`](../../infrastructure/github/README.md) — Branch-protection contexts + `gh api` apply procedure referenced from `github-setup.md`.
- [`infrastructure/oracle/.env.production.example`](../../infrastructure/oracle/.env.production.example) — canonical runtime env-var list with per-phase `# provenance:` comments.
- [`docs/architecture/`](../architecture/) — ADRs (ADR-001..ADR-007 from PR-3) + dep-graph.
- [`docs/research/`](../research/) — phase-by-phase research notes with retrieval-dated citations.

---

## Contributing a new runbook

1. Pick the lifecycle phase it belongs to (bootstrap / daily / launch / scaling / recovery / quarterly).
2. Author at `docs/runbooks/<name>.md` following the template of an existing same-phase runbook (`github-setup.md` for bootstrap, `incident-response.md` for daily, `going-to-production.md` for launch, etc.).
3. Add a row to this index in the right table.
4. Cross-link from related runbooks (every runbook ends with a "Related runbooks" section).
5. Open an ADR if the runbook codifies a new architecture or operational decision.
6. PR through normal workflow; `markdownlint` is the only CI gate for docs-only changes.
