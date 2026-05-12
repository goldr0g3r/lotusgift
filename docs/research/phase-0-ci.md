# Phase-0 Research Note — CI surface, branch protection, Renovate

**Phase:** 0 (foundation)
**Topic:** GitHub Actions workflows, issue/PR templates, CODEOWNERS, branch protection, Renovate, dependency-cruiser, free-tier-burn cron
**Owner:** @goldr0g3r
**Status:** Implementation in progress
**Sub-plan:** [.cursor/plans/pr4-ci-sub-plan_7657e6c3.plan.md](../../.cursor/plans/pr4-ci-sub-plan_7657e6c3.plan.md)
**Parent plan:** [.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

## 1. Goal

Land **PR-4 `ci`** so every subsequent PR (P1 onward) hits a real status-check wall: typecheck/lint/test/build + secret-scan + dependency-review + PR-title gate + dep-cruiser + corporate-gifting-domain linter + free-tier-burn weekly cron + release automation, all gated by CODEOWNERS, branch protection on `main`, and Renovate-driven dependency freshness (≤14 days per `.cursor/rules/always-latest-docs.mdc`).

Companion deliverables: 10 workflows in `.github/workflows/`, 4 issue forms + `config.yml` in `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, `.github/CODEOWNERS`, `infrastructure/github/branch-protection.json` + apply guide, `renovate.json`, `.dependency-cruiser.cjs`, `scripts/free-tier-quota-burn.ts`, and a CI section appended to `README.md`.

## 2. Retrieval-dated citations (verified May 12, 2026)

| # | Topic | Title / Page | URL | Retrieved | Version / Notes |
| --- | --- | --- | --- | --- | --- |
| 1 | GitHub Actions reuse + workflow syntax | Workflow syntax for GitHub Actions | https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions | 2026-05-12 | `on.pull_request`, `on.push`, `on.schedule`, `on.workflow_dispatch`. `concurrency.group` + `cancel-in-progress: true` recommended for PR pipelines. `permissions: {}` defaults to read-only when omitted in workflow scope. |
| 2 | Node setup action | `actions/setup-node` releases | https://github.com/actions/setup-node/releases/tag/v6.4.0 | 2026-05-12 | v6.4.0 (released 2026-04-20). Supports `node-version`, `cache: 'pnpm'` (requires `pnpm/action-setup` run first), `cache-dependency-path: '**/pnpm-lock.yaml'`. |
| 3 | pnpm setup action | `pnpm/action-setup` releases | https://github.com/pnpm/action-setup/releases/tag/v6.0.8 | 2026-05-12 | v6.0.8 (released 2026-05-12). Reads `packageManager` from root `package.json` when `version:` is omitted. Repo currently pins `packageManager: pnpm@9.0.0`. |
| 4 | Conventional PR title gate | `amannn/action-semantic-pull-request` | https://github.com/amannn/action-semantic-pull-request/releases/tag/v6.1.1 | 2026-05-12 | v6.1.1 (released 2025-08-22). `types` input restricts allowed type set; `requireScope: false` for repos with optional scopes. Enforces the format codified in `.cursor/rules/commit-conventions.mdc`. |
| 5 | Secret scanning in CI | `trufflesecurity/trufflehog` releases | https://github.com/trufflesecurity/trufflehog/releases/tag/v3.95.3 | 2026-05-12 | CLI v3.95.3 (released 2026-05-11). Recommended action invocation: `trufflesecurity/trufflehog@main` pinned to the published action version; flags `--only-verified` to suppress unverified noise on PRs. Run on full diff with `base: ${{ github.event.repository.default_branch }}`. |
| 6 | Dependency review | `actions/dependency-review-action` releases | https://github.com/actions/dependency-review-action/releases/tag/v5.0.0 | 2026-05-12 | v5.0.0 (released 2026-05-08). `fail-on-severity: high` + `vulnerability-check: true` + `license-check: true` with `allow-licenses: MIT, Apache-2.0, BSD-3-Clause, BSD-2-Clause, ISC, CC0-1.0`. Free on public repos. |
| 7 | Release automation | `softprops/action-gh-release` releases | https://github.com/softprops/action-gh-release/releases/tag/v3.0.0 | 2026-05-12 | v3.0.0 (released 2026-04-12). `draft: true` + `generate_release_notes: true` produces a manually-publishable draft from PR titles since the last tag. Trigger on `push` of tags matching `v*`. |
| 8 | Repo checkout | `actions/checkout` releases | https://github.com/actions/checkout/releases/tag/v6.0.2 | 2026-05-12 | v6.0.2 (released 2026-01-09). `fetch-depth: 0` required for PR-title checks and full-diff secret scanning. |
| 9 | Workflow linting | `rhysd/actionlint` releases | https://github.com/rhysd/actionlint/releases/tag/v1.7.12 | 2026-05-12 | Go binary v1.7.12 (released 2026-03-30). `npm` wrapper `actionlint` v2.0.6 used for local pre-commit smoke checks. |
| 10 | Branch protection API | REST API endpoints for protected branches | https://docs.github.com/en/rest/branches/branch-protection | 2026-05-12 | `PUT /repos/{owner}/{repo}/branches/{branch}/protection` accepts JSON with `required_status_checks`, `required_pull_request_reviews`, `enforce_admins`, `restrictions`, `required_conversation_resolution`, `allow_force_pushes`, `allow_deletions`, `lock_branch`. |
| 11 | Renovate config | Renovate Configuration Options | https://docs.renovatebot.com/configuration-options/ | 2026-05-12 | Renovate v43.150.0. Presets: `config:recommended`, `schedule:weekly`, `group:allNonMajor`, `:separateMajorReleases`, `:semanticCommits`. `prConcurrentLimit`, `lockFileMaintenance`, `timezone: Asia/Kolkata`. |
| 12 | Renovate GitHub App | Install Renovate via GitHub Marketplace | https://github.com/apps/renovate | 2026-05-12 | One-time user action: install the Renovate app on the `goldr0g3r/lotusgift` repo. Without the app install, the `renovate.json` is inert. |
| 13 | Architecture lint | `dependency-cruiser` docs | https://github.com/sverweij/dependency-cruiser | 2026-05-12 | v17.4.0. Config file `.dependency-cruiser.cjs` exports `{ forbidden: [...], options: { tsConfig, doNotFollow, exclude } }`. Rule severity: `error` blocks CI, `warn` reports only. |
| 14 | Markdown lint | `markdownlint-cli2` | https://github.com/DavidAnson/markdownlint-cli2 | 2026-05-12 | v0.22.1. Respects `.markdownlint.jsonc` at repo root. Shipped in PR-3; reused here. Glob patterns `"**/*.md" "#node_modules" "#_old"`. |
| 15 | Node LTS schedule | Node.js Previous Releases | https://nodejs.org/en/about/previous-releases | 2026-05-12 | Node 22 (Jod) LTS until 2027-04 (Active until 2025-10, Maintenance after). Node 20 (Iron) EOL'd 2026-04. Pin CI to **Node 22.x**; bump repo `engines.node` to `>=22` to match. |
| 16 | Workflow permissions hardening | Automatic token authentication permissions | https://docs.github.com/en/actions/security-guides/automatic-token-authentication | 2026-05-12 | Default `permissions: {}` at workflow scope + grant minimum needed at job scope (e.g. `contents: read`, `pull-requests: write` for PR-title, `issues: write` for free-tier-burn issue creation). |

## 3. Decisions log

| # | Decision | Chose | Rejected | Reasoning |
| --- | --- | --- | --- | --- |
| D1 | Dependency-update bot | Renovate (`renovate.json`) | Dependabot | Richer grouping, lockfile maintenance, monorepo-aware, semantic-commits preset matches the repo's commit conventions. Requires the Renovate GitHub App install (one-time user action). |
| D2 | Branch protection apply timing | Post-merge of PR-4 | Apply before PR-4 lands | Required status checks must exist in the merge-base of the PR they gate; applying before PR-4 lands would block PR-4 itself by demanding workflows that don't yet exist on `main`. |
| D3 | `openapi-drift.yml` + `atlas-search-mapping-drift.yml` | Ship as skeletons | Defer to P4 / P7 | Parent-plan PR-4 todo explicitly lists "skeleton" for both; wiring lands now, the drift check no-ops until the artefacts exist. |
| D4 | `corporate-gifting-domain.yml` invariant | Path-touching only | Full lint matrix | At PR-4 the `services/order-service`, `services/rfq-service`, `services/recipient-list-service` paths don't exist; full matrix would noop trivially. Path-touching invariant fires from P9 onward. |
| D5 | Free-tier-burn API token strategy | Token-gated, `skipped` on miss | Fail if any token missing | Atlas / Vercel / PostHog tokens land progressively (PR-5 dev-stack, PR-7 oracle, P16+ Vercel projects). Cron should never page on bootstrap gaps. |
| D6 | Node version | 22.x LTS | 20.x or 24.x | Node 20 EOL'd 2026-04. Node 22 is Active LTS until 2025-10 then Maintenance until 2027-04 — proven and stable. Node 24 is also LTS but newer (less production exposure). Bump repo `engines.node` to `>=22` for alignment. |
| D7 | CI matrix | Single OS / single Node version | Cross-OS matrix | Repo deploys to Linux (Oracle A1.Flex). Cross-OS adds cost (matrix is per-quota-minute) without value on a free-tier budget. Re-evaluate at P22 launch. |
| D8 | Workflow permissions | Default `{}` + per-job grants | `permissions: write-all` | Hardening default; least-privilege per workflow per GitHub security guide §16. |
| D9 | `release.yml` publish mode | Always-draft | Auto-publish | Solo-dev today; auto-publish skips a useful manual sanity check on tag content. Toggle to auto at P22 launch runbook. |
| D10 | Issue templates format | YAML Forms | Markdown templates | Forms support typed inputs (dropdowns, validation, default labels), reduces triage cost. |
| D11 | Workflow concurrency | `cancel-in-progress: true` on PR ref | Queue all runs | Solo-dev pushes often; canceling superseded runs preserves the free-tier minutes budget. |
| D12 | Branch protection enforce_admins | `false` | `true` | Ops self-merge headroom (e.g., post-merge branch protection apply, emergency rollback). Will flip to `true` at P22 alongside `required_approving_review_count: 2`. |

## 4. Open questions (non-blocking; captured for follow-up)

| # | Question | Owner | Trigger |
| --- | --- | --- | --- |
| Q1 | When do Atlas / Vercel / PostHog API tokens land as repo secrets? | @goldr0g3r | PR-5 (dev-stack) for Atlas; P16 for Vercel; P3b for PostHog. Until then `free-tier-burn.yml` reports `skipped`. |
| Q2 | Renovate GitHub App install confirmation | @goldr0g3r | During PR-4 review. Without the app install, the `renovate.json` is inert. Install URL: https://github.com/apps/renovate |
| Q3 | `corporate-gifting-domain.yml` matrix-spec path | @goldr0g3r | The reserved path `services/rfq-service/test/auto-router.matrix.spec.ts` is touched by the workflow's path filter; the spec itself lands at P9b. |
| Q4 | `release.yml` auto-publish toggle | @goldr0g3r | P22 launch runbook decision. |
| Q5 | `enforce_admins` flip + `required_approving_review_count` bump to 2 | @goldr0g3r | P22 when the team scales beyond solo. |
| Q6 | `actionlint` in CI as a required check | @goldr0g3r | Add to required-status-checks list after first run shows stability. Bake into `ci.yml` now, escalate to required check post-merge. |

## 5. Implementation checklist

- [ ] `docs/research/phase-0-ci.md` committed (this file).
- [ ] `.markdownlint.jsonc` mirrored from PR-3 (no-conflict-on-merge-order).
- [ ] 10 workflows in `.github/workflows/`: `ci.yml`, `pr-title.yml`, `secret-scan.yml`, `dependency-review.yml`, `dep-cruiser.yml`, `openapi-drift.yml` (skeleton), `atlas-search-mapping-drift.yml` (skeleton), `corporate-gifting-domain.yml`, `free-tier-burn.yml` (weekly cron), `release.yml`.
- [ ] 4 issue forms + `config.yml` in `.github/ISSUE_TEMPLATE/`.
- [ ] `.github/pull_request_template.md`.
- [ ] `.github/CODEOWNERS`.
- [ ] `infrastructure/github/branch-protection.json` + `infrastructure/github/README.md` apply guide.
- [ ] `renovate.json` at repo root.
- [ ] `.dependency-cruiser.cjs` at repo root + `dependency-cruiser` in root `devDependencies`.
- [ ] `scripts/free-tier-quota-burn.ts` (token-gated, opens issue on >70% quota burn).
- [ ] Root `README.md` CI section appended (will conflict with PR-3 rewrite; rebase after PR-3 merges).
- [ ] Root `package.json` `engines.node` bumped to `>=22`.
- [ ] Smoke: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `markdownlint-cli2`, `actionlint` all green.
- [ ] PR opened with Copilot reviewer + phase-0 epic #4 + phase-acceptance #5 commented.
- [ ] Post-merge: branch protection applied via `gh api PUT`; parent-plan todo `p0-ci` → `completed`; Projects v2 item → Done.

## 6. Versions (locked at PR-4 commit time)

| Package | Version | Notes |
| --- | --- | --- |
| `actions/checkout` | `v6` | Major-pinned; v6.0.2 latest. |
| `actions/setup-node` | `v6` | v6.4.0 latest. |
| `pnpm/action-setup` | `v6` | v6.0.8 latest. |
| `amannn/action-semantic-pull-request` | `v6` | v6.1.1 latest. |
| `trufflesecurity/trufflehog` | `v3.95.3` | Pin exact, latest stable. |
| `actions/dependency-review-action` | `v5` | v5.0.0 latest. |
| `softprops/action-gh-release` | `v3` | v3.0.0 latest. |
| `dependency-cruiser` | `^17.4.0` | Devdep at workspace root. |
| `tsx` | `^4.21.0` | Devdep at workspace root (already present? confirmed missing — added). |
| Node | `22.x` LTS | CI matrix value; repo `engines.node` bumped to `>=22`. |
| pnpm | `9.0.0` | From repo `packageManager`. |
| Renovate | `43.150.0` | Bot-managed; pinned by the Renovate App. |
| `markdownlint-cli2` | `0.22.1` | Run via `pnpm dlx`. |
| `actionlint` (binary) | `1.7.12` | Run via `pnpm dlx actionlint` (npm wrapper v2.0.6). |

## 7. Implementation reference

Pending — populated post-merge with PR # + merge SHA + Projects v2 status sync confirmation.
