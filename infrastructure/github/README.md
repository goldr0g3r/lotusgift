# Infrastructure — GitHub repo settings

Source-of-truth for repo-administration settings that are managed via the GitHub REST API rather than the web UI. Apply with `gh` CLI; never edit branch protection in the UI directly (drift gets lost on the next apply).

## Branch protection (`main`)

[`branch-protection.json`](branch-protection.json) holds the canonical payload for `PUT /repos/{owner}/{repo}/branches/{branch}/protection` (see the [REST API reference](https://docs.github.com/en/rest/branches/branch-protection)).

### Apply

```bash
gh api -X PUT repos/goldr0g3r/lotusgift/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input infrastructure/github/branch-protection.json
```

### Required scopes on the PAT

- Classic PAT: `repo` (full).
- Fine-grained PAT: Repository → Administration (Read/Write) + Contents (Read).

### Required-check contexts

| # | Context | Source workflow | Notes |
| --- | --- | --- | --- |
| 1 | `typecheck` | `.github/workflows/ci.yml` | `pnpm turbo run check-types` over the monorepo. |
| 2 | `lint` | `.github/workflows/ci.yml` | `pnpm lint` (ESLint via turbo). |
| 3 | `test` | `.github/workflows/ci.yml` | `pnpm test` (Jest via turbo). |
| 4 | `build` | `.github/workflows/ci.yml` | `pnpm build` (turbo). |
| 5 | `markdownlint` | `.github/workflows/ci.yml` | `markdownlint-cli2` over `**/*.md` excluding `_old/` and `node_modules/`. |
| 6 | `actionlint` | `.github/workflows/ci.yml` | `rhysd/actionlint` v1.7.12 over `.github/workflows/`. |
| 7 | `pr-title` | `.github/workflows/pr-title.yml` | `amannn/action-semantic-pull-request@v6` enforces commit-conventions.mdc on PR titles. |
| 8 | `secret-scan` | `.github/workflows/secret-scan.yml` | `trufflesecurity/trufflehog@v3.95.3` `--only-verified --fail`. |
| 9 | `dependency-review` | `.github/workflows/dependency-review.yml` | `actions/dependency-review-action@v5` `fail-on-severity: high`. |
| 10 | `dep-cruiser` | `.github/workflows/dep-cruiser.yml` | architecture-layers + microservice-boundaries enforcement. |
| 11 | `openapi-drift` | `.github/workflows/openapi-drift.yml` | Skeleton — no-op until `packages/api/openapi.json` exists (P4). |
| 12 | `atlas-search-mapping-drift` | `.github/workflows/atlas-search-mapping-drift.yml` | Skeleton — no-op until `infrastructure/atlas/search/*.json` mappings exist (P7). |
| 13 | `corporate-gifting-domain` | `.github/workflows/corporate-gifting-domain.yml` | No-op until services/{order,rfq,recipient-list,customization}-service have real code (P9). |
| 14 | `build-push` | `.github/workflows/deploy-oracle.yml` | Multi-arch `docker buildx` + push to `ghcr.io/<owner>/lotusgift-api`. The sibling `deploy` + `verify` jobs in the same workflow run only when `vars.LOTUSGIFT_ORACLE_DEPLOY_ENABLED == 'true'`, so they remain optional contexts until the Oracle VM is provisioned. |

> **Context naming caveat.** GitHub Actions reports check names slightly differently across workflow shapes. After the first PR run lands, run `gh api repos/goldr0g3r/lotusgift/commits/<merge-sha>/check-runs --jq '.check_runs[].name'` to capture the exact strings; reconcile this JSON if any names diverge from the table above.

### Decision timing

- **Apply post-merge of PR-4 only.** Required-check contexts must exist in the merge-base of the PR they gate; applying before PR-4 lands would block PR-4 itself.
- Bump `required_approving_review_count` from `1` to `2` and `enforce_admins` from `false` to `true` at P22 launch when the team scales beyond solo.

### Audit + drift detection

```bash
gh api repos/goldr0g3r/lotusgift/branches/main/protection > /tmp/live.json
diff <(jq -S . infrastructure/github/branch-protection.json) <(jq -S . /tmp/live.json)
```

Open an issue tagged `area/infra` + `prio/p1-high` on any drift.

## Future GitHub-managed settings

Reserved for follow-on PRs:

- `infrastructure/github/repository.json` — repo metadata (description, topics, homepage).
- `infrastructure/github/rulesets/*.json` — modern repo Rulesets (supersedes legacy branch protection at P22).
- `infrastructure/github/secret-scanning.json` — secret scanning + push-protection config.
