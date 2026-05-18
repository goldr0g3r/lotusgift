# How-to guides

**Audience**: contributors performing common, well-defined tasks
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Task-oriented walkthroughs. One page per recipe. Each maps to the relevant cursor rule + skill.

## Gating loops (do BEFORE writing code)

These loops gate every meaningful change. Read before your first ADR / research note / design discovery.

| Loop                 | Recipe                                                       | Binding rule                                                                                     | Skill                                                                  |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| **ADR**              | [`open-an-adr.md`](./open-an-adr.md)                         | N/A (follow template)                                                                            | (manual — use `docs/adr/template.md`)                                  |
| **Research note**    | [`open-a-research-note.md`](./open-a-research-note.md)       | [`.cursor/rules/research-note-per-module.mdc`](../../.cursor/rules/research-note-per-module.mdc) | (manual)                                                               |
| **Design Discovery** | [`open-a-design-discovery.md`](./open-a-design-discovery.md) | [`.cursor/rules/design-discovery.mdc`](../../.cursor/rules/design-discovery.mdc)                 | (manual)                                                               |

## GitHub workflow

| Task                     | Recipe                                             |
| ------------------------ | -------------------------------------------------- |
| Open a pull request      | [`open-a-pr.md`](./open-a-pr.md)                   |
| Open an issue            | [`open-an-issue.md`](./open-an-issue.md)           |
| Set project field values | [`set-project-fields.md`](./set-project-fields.md) |

## Scaffolding new code

| Task                                    | Recipe                                                   | Skill                                                                      |
| --------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| Add a REST endpoint                     | [`add-a-rest-endpoint.md`](./add-a-rest-endpoint.md)     | [`add-rest-endpoint`](../../.cursor/skills/add-rest-endpoint/SKILL.md)     |
| Add a bounded-context service           | [`add-a-service.md`](./add-a-service.md)                 | (manual — use `scripts/scaffold-package.ts`)                               |

## Phase lifecycle

| Task                      | Recipe                                   |
| ------------------------- | ---------------------------------------- |
| Close a phase (milestone) | [`close-a-phase.md`](./close-a-phase.md) |

## Discipline summary (the irreducible minimum)

1. **Branch from `main`** → `<type>/<scope>-<short-kebab>`
2. **Conventional Commits** → `<type>(<scope>): <subject ≤ 72 chars>`. Body explains WHY.
3. **Open a PR** → use `gh pr create` with `type/*` + `ws/*` + `phase/*` labels.
4. **CI must pass** → typecheck, lint, test, dep-cruiser, openapi:check, gitleaks.
5. **Squash-merge** → only merge strategy on `main`.

## See also

- [`../getting-started/README.md`](../getting-started/README.md) — get the repo running first.
- [`../deployment/README.md`](../deployment/README.md) — when you need to ship.
- [`../../AGENTS.md`](../../AGENTS.md) — coding-agent rules of engagement.
- [`../../.cursor/rules/`](../../.cursor/rules/) — the 15 cursor rules.
- [`../../.cursor/skills/`](../../.cursor/skills/) — cursor skills.
