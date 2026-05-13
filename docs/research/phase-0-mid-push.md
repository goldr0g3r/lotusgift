# Phase-0 Mid-Push Research Note

> Rolling note for the P0 mid-push sub-plan: merge open PRs (#7/#8/#9), sync the `refactor` archive branch, and ship the small `p0-github-setup-runbook` PR.

**Date:** 2026-05-13
**Phase:** 0
**Workstream:** infra + docs
**Sub-plan:** [`.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md`](../../.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md)

## 1. Implementation reference

PRs merged in this cycle, in execution order:

| # | Title | Base | Head | Merge | SHA |
| --- | --- | --- | --- | --- | --- |
| [#9](https://github.com/goldr0g3r/lotusgift/pull/9) | feat(infra): add local Docker Compose dev stack (Mongo + Redis + Mailpit + OTEL Collector) | main | pr-5-dev-stack | squash | [`be1e8d13`](https://github.com/goldr0g3r/lotusgift/commit/be1e8d13) |
| [#7](https://github.com/goldr0g3r/lotusgift/pull/7) | docs(architecture): add ADR-001..007 + dep-graph + README rewrite | main | pr-3-docs | squash | [`06b16a90`](https://github.com/goldr0g3r/lotusgift/commit/06b16a90) |
| [#8](https://github.com/goldr0g3r/lotusgift/pull/8) | ci(ci): add Phase-0 CI surface (10 workflows + Renovate + branch protection + CODEOWNERS) | main | pr-4-ci | squash | [`3c4fa3a1`](https://github.com/goldr0g3r/lotusgift/commit/3c4fa3a1) |
| [#10](https://github.com/goldr0g3r/lotusgift/pull/10) | chore(v2): catch up refactor branch with main (PR-1..PR-5 + rules direct-to-main) | refactor | refactor-catchup | merge-commit | [`46a9f4a8`](https://github.com/goldr0g3r/lotusgift/commit/46a9f4a8) |
| [#11](https://github.com/goldr0g3r/lotusgift/pull/11) | docs(runbook): add docs/runbooks/github-setup.md (step-by-step GitHub project bootstrap) | main | pr-0a-github-setup | squash | [`48842d70`](https://github.com/goldr0g3r/lotusgift/commit/48842d70) |

Direct-to-main follow-ups:

- [`c8f3732`](https://github.com/goldr0g3r/lotusgift/commit/c8f3732) — `docs(plan): mark p0-docs + p0-ci + p0-dev-stack completed (PRs #7/#8/#9 merged)` (parent plan frontmatter sync after PR-9/PR-7/PR-8 merged).

## 2. Copilot feedback rounds + human resolution

| PR | First Copilot pass | Resolution commit | Second pass | Outcome |
| --- | --- | --- | --- | --- |
| #7 | Re-requested (no prior review history) | _none needed_ | Re-requested before merge; no NEW comments surfaced | Merged squash `06b16a90` |
| #8 | 2 commented reviews (2026-05-12 16:44 + 17:48), 8 nits | [`17686ee`](https://github.com/goldr0g3r/lotusgift/commit/17686ee) "ci(ci): address Copilot review feedback (8 nits)" | Re-requested; new review absent at merge time | Merged squash `3c4fa3a1` after resolving `.markdownlint.jsonc` + `README.md` conflicts via merge commit `21ae1dd` |
| #9 | 1 commented review (2026-05-12 18:45), 4 nits | [`336c4c4`](https://github.com/goldr0g3r/lotusgift/commit/336c4c4) "feat(infra): address Copilot review feedback (4 nits)" | Re-requested; new review absent at merge time | Merged squash `be1e8d13` |
| #10 | _none requested_ (catch-up PR with already-reviewed commits) | n/a | n/a | Merged merge-commit `46a9f4a8` |
| #11 | Requested; no review surfaced before merge | n/a | n/a | Merged squash `48842d70` |

**Conflict resolution detail (#8):** PR-7 (docs) added the LotusGift architecture sections (Vision, Architecture at a glance, Decision log) to README.md and PR-4 (ci) added the Continuous integration section + node version bump. After PR-7 + PR-9 merged into main first, pr-4-ci needed `git merge origin/main` locally; conflicts in `.markdownlint.jsonc` (PR-4 has the superset of disabled rules) and `README.md` (kept all PR-7 sections + PR-4 CI section + Node 22 quickstart). Resolution committed as `21ae1dd`.

## 3. `refactor` branch sync

`refactor` was a local-only branch (HEAD `b5c83b0`, 7 commits behind main) used as the v2 archive snapshot. The sync workflow:

1. `git push origin refactor` — published the branch.
2. `git checkout -b refactor-catchup main` — ephemeral branch at main HEAD.
3. Opened PR [#10](https://github.com/goldr0g3r/lotusgift/pull/10): head=refactor-catchup, base=refactor.
4. Merged with **merge-commit** (not squash) so the 11 commits' history is preserved on refactor for traceability.

Commits brought across (oldest first):

```text
7d50829  chore(scaffold): archive _old/ + re-scaffold workspace via CLI (#1)
e9a4321  docs(research): finalize phase-0-scaffold note with PR #1 implementation reference (squash 7d50829)
dacbbbb  docs(research): update phase-0-scaffold documentation with implementation details and references  (PR-2 rules bulk)
31e927e  docs(rules): mark phase-0 rules implementation complete + link tracking issue #2
9b2a481  docs(research): finalize phase-0-rules + dacbbbb verification (#6)
6d9d06e  docs(research): record PR #6 + merge SHA in phase-0-rules section 7
e1fdf2d  docs(research): update phase-0-rules with additional references and clarify governance structure
be1e8d1  feat(infra): add local Docker Compose dev stack (Mongo + Redis + Mailpit + OTEL Collector) (#9)
06b16a9  docs(architecture): add ADR-001..007 + dep-graph + README rewrite (#7)
3c4fa3a  ci(ci): add Phase-0 CI surface (10 workflows + Renovate + branch protection + CODEOWNERS) (#8)
c8f3732  docs(plan): mark p0-docs + p0-ci + p0-dev-stack completed (PRs #7/#8/#9 merged)
```

Policy going forward: future PRs (PR-6 / PR-7 / PR-8 and P1–P22) target `main`. `refactor` is periodically caught up at major milestones via another `refactor-catchup` PR (merge-commit). This keeps `refactor` as a v2-rebuild archive without dual-base workflow overhead.

## 4. Branch hygiene

Stale branches deleted in this cycle (both locally and on origin):

| Branch | Reason | Status |
| --- | --- | --- |
| `pr-1-archive-scaffold` | PR #1 merged | to delete |
| `pr-2-retro-sync` | PR #6 merged | to delete |
| `pr-3-docs` | PR #7 merged | to delete |
| `pr-4-ci` | PR #8 merged | to delete |
| `pr-5-dev-stack` | PR #9 merged | to delete |
| `refactor-catchup` | PR #10 merged | to delete |
| `pr-0a-github-setup` | PR #11 merged | to delete |
| `redesign-ui` | already deleted by user | n/a |

Final state on origin: `main`, `refactor` only.

## 5. Phase-0 progress signal

After this sub-plan lands:

- **Phase-0 Epic [#4](https://github.com/goldr0g3r/lotusgift/issues/4)** — 7 of 9 checkboxes ticked: PR-1, PR-2, PR-3, PR-4, PR-5, p0-issues, p0-github-setup-runbook. Remaining: PR-6 (`p0-design`), PR-7 (`p0-oracle-runbook`), PR-8 (`p0-future-docs`).
- **Phase-0 Phase-Acceptance [#5](https://github.com/goldr0g3r/lotusgift/issues/5)** — 9 of 13 acceptance lines ticked. Remaining: `@repo/design-tokens` + `@repo/ui`, oracle runbook, future-state runbooks, `phase-acceptance-validator` subagent (post-CI verification).
- **Parent plan todos** — `p0-design`, `p0-oracle-runbook`, `p0-future-docs` remain `pending`.

## 6. Next sub-plan signal

The next sub-plan should target **`p0-design`** (PR-6): `docs/design/DESIGN.md` + `@repo/design-tokens` (TypeScript source-of-truth emitting SCSS + typed TS) + `@repo/ui` baseline on Radix Primitives + CSS Modules + Sass mixins (`btn-primary`, `btn-pink`, `btn-outline`, `btn-disc`, `eyebrow`, `h1-display`, `icon-circle`). WCAG 2.2 AA floor + `@axe-core/playwright` in CI. References the `apps/web/tailwind.config.ts` from `_old/` for the brand palette + animation keyframes.

## 7. References

- Sub-plan: [`.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md`](../../.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md)
- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)
- Phase-0 Epic: [#4](https://github.com/goldr0g3r/lotusgift/issues/4)
- Phase-0 Phase-Acceptance: [#5](https://github.com/goldr0g3r/lotusgift/issues/5)
- Phase-0 Research-Note: [#3](https://github.com/goldr0g3r/lotusgift/issues/3) (closed)
- Prior research notes: [`phase-0-scaffold.md`](phase-0-scaffold.md), [`phase-0-rules.md`](phase-0-rules.md)
