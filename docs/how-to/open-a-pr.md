# Open a pull request

**Audience**: every contributor
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Branch naming

```
<type>/<scope>-<short-kebab>
```

Examples:
- `feat/auth-passkey-login`
- `fix/inventory-reservation-ttl`
- `docs/adr-0008-payment-gateway`
- `chore/ci-add-dep-cruiser`

## Commit message format

```
<type>(<workstream-scope>): <imperative summary ≤ 72 chars>

[optional body — explains WHY]

[optional footer — Closes #N]
```

## Opening the PR

```powershell
gh pr create `
  --title "feat(auth): add passkey WebAuthn registration" `
  --body "Implements passkey registration flow per Better-Auth docs.`n`nCloses #70" `
  --label "type/feat" `
  --label "ws/auth" `
  --label "phase/P5"
```

### Required labels (at least one from each)

| Category | Pick one |
| -------- | -------- |
| Type | `type/feat`, `type/fix`, `type/chore`, `type/docs`, `type/refactor`, `type/test`, `type/perf`, `type/ci` |
| Workstream | `ws/scaffold`, `ws/auth`, `ws/vendor`, etc. |
| Phase | `phase/P0` through `phase/P22` |

### Optional labels

- Priority: `prio/p0-critical`, `prio/p1-high`, `prio/p2-medium`, `prio/p3-low`
- Area: `area/corporate-gifting`, `area/security`, `area/accessibility`, `area/observability`

## Pre-push checklist

Run these locally (CI runs the same set):

```powershell
pnpm typecheck      # TypeScript across workspace
pnpm lint           # ESLint + Prettier
pnpm test           # Jest (backend) + Vitest (frontend)
pnpm dep-cruiser    # Layer + boundary enforcement
pnpm openapi:check  # OpenAPI drift detection
```

## Merge strategy

**Squash-merge only** on `main`. The `merge-on-ci-green.yml` workflow auto-merges when CI passes. Otherwise:

```powershell
gh pr merge --squash --delete-branch
```

## See also

- [`.github/instructions/commit-conventions.instructions.md`](../../.github/instructions/commit-conventions.instructions.md)
- [`set-project-fields.md`](./set-project-fields.md) — set project board fields after PR lands
