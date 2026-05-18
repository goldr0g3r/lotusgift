# First contribution

**Audience**: new contributors
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Walk through a tiny docs-only PR end-to-end. Demonstrates branching, Conventional Commits, label routing, auto-merge.

## 1. Create a branch

```powershell
git checkout -b docs/fix-typo-in-readme
```

Branch naming: `<type>/<scope>-<short-kebab>`.

## 2. Make your change

Edit a file — fix a typo, improve a sentence, add a missing link.

## 3. Commit with Conventional Commits

```powershell
git add .
git commit -m "docs(scaffold): fix typo in getting-started README"
```

Format: `<type>(<workstream-scope>): <imperative summary>`

Allowed types: `feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `perf` · `ci` · `build` · `style`

Allowed scopes: see [`.github/instructions/commit-conventions.instructions.md`](../../.github/instructions/commit-conventions.instructions.md).

## 4. Push

```powershell
git push -u origin docs/fix-typo-in-readme
```

## 5. Open a PR

```powershell
gh pr create --title "docs(scaffold): fix typo in getting-started README" --body "Minor typo fix." --label "type/docs" --label "ws/scaffold" --label "phase/P0"
```

The `add-to-project.yml` workflow auto-adds the PR to project #9.
The `auto-assign.yml` workflow assigns you.

## 6. CI runs

Wait for CI to pass (lint, typecheck, test).

## 7. Merge

The `merge-on-ci-green.yml` workflow auto-squash-merges once CI passes (if enabled). Otherwise:

```powershell
gh pr merge --squash --delete-branch
```

## Label reference (quick)

| Category | Labels |
| -------- | ------ |
| Type | `type/feat`, `type/fix`, `type/chore`, `type/docs`, `type/refactor`, `type/test`, `type/perf`, `type/ci` |
| Phase | `phase/P0` through `phase/P22` |
| Workstream | `ws/scaffold`, `ws/auth`, `ws/vendor`, `ws/product`, `ws/inventory`, etc. |
| Priority | `prio/p0-critical`, `prio/p1-high`, `prio/p2-medium`, `prio/p3-low` |

## Next step

→ [`troubleshooting.md`](./troubleshooting.md) (if stuck) or [`../how-to/README.md`](../how-to/README.md) (for task recipes)
