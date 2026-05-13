# GitHub Setup Runbook

> One-shot bootstrap for a fresh LotusGift v2 contributor (or a recreated repo). Run sections 1–8 in order. Total time: ~15 minutes.

This runbook captures every manual + scripted step that brought `goldr0g3r/lotusgift` from a private free-tier repo with no governance to the current Phase-0 state: public repo, 23 milestones, 52 custom labels, Phase-0 Epic + Research-Note + Phase-Acceptance issues, and a fully-wired Projects v2 board.

Prerequisites: a GitHub account with admin rights on the target repo, a working `git` install, Node 22+ LTS, pnpm 9+, and (optional but recommended) a Cursor or Claude Code agent for plan-driven execution.

---

## Step 1 — Flip repo visibility to public (≈30 seconds)

GitHub Free for personal accounts allows **unlimited private repos** but with a *limited* feature set (no protected branches, no CODEOWNERS, no Rulesets on private). Public repos on free unlock all of these.

1. Visit `https://github.com/<owner>/<repo>/settings`.
2. Scroll to **Danger Zone**.
3. Click **Change visibility → Change to public**.
4. Confirm by typing `<owner>/<repo>`.

After the flip:

- `gh repo view <owner>/<repo> --json visibility` should return `"visibility": "PUBLIC"`.
- Branch protection, CODEOWNERS, Rulesets, Insights, and the full GitHub Actions minute allowance unlock automatically.

If you must stay private, upgrade to **GitHub Pro ($4/mo)** or scope down the workflow (skip branch protection in PR-4 / `p0-ci`).

---

## Step 2 — Provision a PAT with the right scope (≈2 minutes)

Two flavours of PAT work; we use **classic** for personal-account Projects v2 because the fine-grained PAT does not expose a user-level `Projects` permission (as of May 2026).

### Classic PAT (recommended for `gh project` operations on personal accounts)

`https://github.com/settings/tokens` → **Generate new token (classic)**. Scopes to check:

- `repo` (all 5 sub-boxes) — repo content + PRs + issues
- `workflow` — Actions workflow updates
- `write:packages`, `read:packages` — GHCR
- `project` — **required** for Projects v2 access
- `read:user`, `user:email`
- Optionally `delete_repo`, `admin:org` (only if you plan to migrate the repo into an org later)

Expiry: 30 days; rotate quarterly via the same form.

### Fine-grained PAT (use for the GitHub MCP / repo-only operations)

`https://github.com/settings/personal-access-tokens` → **Generate new token**. Permissions:

| Scope | Access |
| --- | --- |
| Repository: Actions / Administration / Contents / Discussions / Issues / Pull requests / Variables / Webhooks / Workflows | Read and write |
| Repository: Metadata | Read |
| Account: Projects | (Not exposed for personal accounts; use the classic PAT instead.) |

> **Security note:** PAT values are secret. Never commit one to git. The Cursor GitHub MCP stores its PAT in the OS keychain; revoke + rotate immediately if a token surfaces in chat history.

---

## Step 3 — Create the Projects v2 board (≈3 minutes)

1. Open `https://github.com/users/<owner>/projects/new` (the `users/` path is correct for a personal account; orgs use `orgs/<org>/projects/new`).
2. Choose template **Roadmap** (best fit for our 22-phase plan).
3. Name the project (e.g., `LotusGift v2 Roadmap`).
4. Click **Create project**. Note the project number (`https://github.com/users/<owner>/projects/<N>`) — that `<N>` is the project number used by `gh project` commands.

---

## Step 4 — Add 4 custom fields (≈3 minutes)

Click the `+` in the column header row of the project view to add each field. Capture the option IDs once created (visible via `gh project field-list <N> --owner <owner> --format json`).

**Phase** (Single-select):

```text
P0, P1, P2, P3, P3b, P4, P5, P6, P7, P8, P8b, P9, P9b, P9c, P10,
P11, P12, P13, P14, P15, P16, P17, P18, P19, P20, P21, P22
```

**Workstream** (Single-select):

```text
platform, auth, vendor, product, inventory, rfq, customization,
recipient-list, order, payment, shipping, tax, promotions,
notification, support, review, insights, frontend-customer,
frontend-vendor, frontend-admin, frontend-cs, observability,
docs, infra, design
```

**Layer** (Single-select):

```text
L0, L1, L2, L3, L4, L5, L6
```

**Type** (Single-select, Conventional Commits):

```text
feat, fix, refactor, chore, docs, perf, test, build, ci, revert
```

Also extend the built-in **Status** field options to: `Backlog`, `Todo`, `Ready`, `In progress`, `In review`, `Blocked`, `Done` (click the Status column header → **Manage options**).

Optionally remove unused built-ins: Team, Estimate, Iteration, Start date, Target date (we use milestones for dates).

---

## Step 5 — Link the project to the repo (≈30 seconds)

1. In the project view, click the **`...`** menu (top-right) → **Workflows**.
2. Enable **Auto-add to project** → select the target repo → filter `is:issue,pr is:open` → **Save**.

Every new issue or PR in the repo now auto-lands on the board as an unconfigured item; we then set Phase/Workstream/Layer/Type/Status programmatically per the per-PR status-sync workflow.

---

## Step 6 — Bootstrap milestones + labels (≈90 seconds, scripted)

This step is fully scripted by the `p0-rules` retro-sync PR (#6) and replayable from the [`p0_mid-push_merge_sync_refactor_2bce06d8.plan.md`](../../.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md) section 4. The canonical commands:

### 23 milestones (Phase 0 → Phase 22)

```powershell
$milestones = @(
  @{t = "Phase 0 - Foundation Reset"; d = "Parent plan ids: p0-scaffold ... p0-issues"},
  @{t = "Phase 1 - L0 Packages"; d = "Parent plan id: p1. ..."},
  # ... 21 more, see retro-sync PR for the full list
)
foreach ($m in $milestones) {
  gh api repos/<owner>/<repo>/milestones -X POST `
    -f title="$($m.t)" `
    -f description="$($m.d)"
}
```

### 52-label set

```powershell
# type/* (10)
foreach ($t in @('feat','fix','refactor','chore','docs','perf','test','build','ci','revert')) {
  gh label create "type/$t" --color 0075ca --description "Conventional Commits type: $t" --force --repo <owner>/<repo>
}
# phase/P0..P22 (23) - color 5319e7
# prio/P0..P3 (4) - red-to-green gradient
# area/* (5) - color 0e8a16
# 10 special labels: research-note, design-discovery, epic, feature, bug, phase-acceptance,
#                    needs-research, blocked, breaking-change, good-first-issue
```

Once labels + milestones exist, open the canonical Phase-0 issues:

| Issue | Title | Initial state | Labels |
| --- | --- | --- | --- |
| #3 | Phase 0 — Research Note | `closed` (state_reason: completed) | research-note, phase/P0, area/docs, type/docs |
| #4 | Phase 0 — Epic: Foundation Reset | open | epic, phase/P0, area/infra |
| #5 | Phase 0 — Phase Acceptance | open | phase-acceptance, phase/P0 |

All three carry milestone `Phase 0 - Foundation Reset` (milestone #1).

---

## Step 7 — Install gh CLI + configure proxy + persistent auth (≈5 minutes on Windows)

```powershell
# 1. Install gh CLI
winget install --id GitHub.cli

# 2. Refresh PATH in current shell (or restart Cursor)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" `
          + [System.Environment]::GetEnvironmentVariable("Path","User")

# 3. Verify
gh --version    # expect 2.92.0+ (verified May 2026)

# 4. Set proxy (if behind a corporate firewall)
$env:HTTPS_PROXY = "http://localhost:3128"
$env:HTTP_PROXY  = "http://localhost:3128"
$env:NO_PROXY    = "localhost,127.0.0.1"

# 5. Persistent auth via classic PAT
"<paste-classic-PAT>" | gh auth login --with-token --hostname github.com

# 6. Confirm scopes (must include 'project' for Projects v2 access)
gh auth status
```

For non-Windows: `gh` is in Homebrew (`brew install gh`), apt (`sudo apt install gh`), etc. Proxy config is identical (HTTPS_PROXY env var).

---

## Step 8 — Verify the bootstrap (≈1 minute)

Run all four checks; each must succeed before any new PR work begins.

```powershell
# A. Project board reachable + 4 custom fields exist
gh project list --owner <owner>
gh project field-list <N> --owner <owner> --format json `
  | ConvertFrom-Json | Select-Object -ExpandProperty fields `
  | Where-Object { $_.name -in @('Phase','Workstream','Layer','Type') } `
  | Format-Table name, dataType

# B. 23 milestones exist
gh api repos/<owner>/<repo>/milestones --jq 'length'   # expect 23

# C. 52 custom labels exist
gh label list --repo <owner>/<repo> --limit 100 --json name `
  | ConvertFrom-Json `
  | Where-Object { $_.name -match '^(type|phase|prio|area)/' -or `
                   $_.name -in @('research-note','design-discovery','epic','feature','bug','phase-acceptance','needs-research','blocked','breaking-change','good-first-issue') } `
  | Measure-Object   # expect Count >= 52

# D. Phase-0 issues exist
gh issue list --repo <owner>/<repo> --state all `
  --label "phase/P0" --json number,title,state `
  | ConvertFrom-Json | Format-Table number, state, title
```

Expected output: project listed with 4 custom fields; 23 milestones; ≥52 custom labels; issues #3 (CLOSED, Research-Note), #4 (OPEN, Epic), #5 (OPEN, Phase-Acceptance).

---

## Operational invariants going forward

- **Every PR** carries a `phase/PN` label + the matching milestone + the relevant `type/*` label.
- **Status sync after every merge:** add the PR to the Projects v2 board (or wait for auto-add), set Status to `Done`, set Phase/Workstream/Layer/Type. Tick the corresponding line in the Phase-N Epic body. Tick the corresponding line in the Phase-N Phase-Acceptance body when applicable.
- **Direct-to-main commits** are reserved for short docs-only status-sync follow-ups (≤1 file, ≤10 lines). Anything bigger goes through a PR.
- **`refactor` branch** is a v2 archive snapshot. Brought up to main via a periodic `refactor-catchup` PR with merge-commit (not squash) at major phase boundaries.

---

## References

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)
- P0-rules retro-sync sub-plan: [`.cursor/plans/p0-rules_retro-sync_governance_032648dd.plan.md`](../../.cursor/plans/p0-rules_retro-sync_governance_032648dd.plan.md)
- P0 mid-push sub-plan: [`.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md`](../../.cursor/plans/p0_mid-push_merge_sync_refactor_2bce06d8.plan.md)
- Phase-0 Epic: [#4](https://github.com/goldr0g3r/lotusgift/issues/4)
- Phase-0 Phase-Acceptance: [#5](https://github.com/goldr0g3r/lotusgift/issues/5)
- GitHub Projects v2 docs (retrieved 2026-05-12): <https://docs.github.com/en/issues/planning-and-tracking-with-projects/>
- gh CLI manual (retrieved 2026-05-12): <https://cli.github.com/manual/>
- GitHub Free plan limits (retrieved 2026-05-12): <https://docs.github.com/en/get-started/learning-about-github/githubs-plans>
