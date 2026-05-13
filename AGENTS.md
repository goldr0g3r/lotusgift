# AGENTS.md — LotusGift v2

This file is the entry point for **non-Copilot AI coding agents** (Cursor agents, Claude Code, OpenAI Codex, Aider, Cline, Continue, etc.) working on this repo. It follows the [agentsmd.net](https://agentsmd.net) nearest-wins lookup convention.

## Read these in order

1. **Project overview, build commands, validation steps, architecture** → [`.github/copilot-instructions.md`](.github/copilot-instructions.md). Same content GitHub Copilot loads — the nearest-wins lookup means agents respect both files.
2. **Path-specific rules** → [`.cursor/rules/`](.cursor/rules/) (Cursor) or [`.github/instructions/`](.github/instructions/) (Copilot). Both are 1:1 mirrors; pick whichever your tool understands natively.
3. **Parent plan** → [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) for the 22-phase roadmap and architectural rationale.
4. **Research notes** → [`docs/research/`](docs/research/) — every dependency choice has a retrieval-dated citation here.

## Rule index (15 rules)

| Rule | Scope | Always-apply? |
|------|-------|---------------|
| [api-type-safety](.cursor/rules/api-type-safety.mdc) | API layer | path-scoped |
| [deployment-mode](.cursor/rules/deployment-mode.mdc) | repo-wide | yes |
| [research-note-per-module](.cursor/rules/research-note-per-module.mdc) | repo-wide | yes |
| [design-discovery](.cursor/rules/design-discovery.mdc) | frontend + UI | path-scoped |
| [analytics-instrumentation](.cursor/rules/analytics-instrumentation.mdc) | apps + services | path-scoped |
| [always-latest-docs](.cursor/rules/always-latest-docs.mdc) | repo-wide | yes |
| [free-tier-budget](.cursor/rules/free-tier-budget.mdc) | repo-wide | yes |
| [architecture-layers](.cursor/rules/architecture-layers.mdc) | repo-wide | yes |
| [microservice-boundaries](.cursor/rules/microservice-boundaries.mdc) | services | path-scoped |
| [event-driven-discipline](.cursor/rules/event-driven-discipline.mdc) | services + events | path-scoped |
| [test-coverage](.cursor/rules/test-coverage.mdc) | repo-wide | yes |
| [corporate-gifting-domain](.cursor/rules/corporate-gifting-domain.mdc) | RFQ/order/customization/recipient-list | path-scoped |
| [no-composer-2](.cursor/rules/no-composer-2.mdc) | subagent spawning | yes |
| [commit-conventions](.cursor/rules/commit-conventions.mdc) | repo-wide | yes |
| [secrets-and-secrets-handling](.cursor/rules/secrets-and-secrets-handling.mdc) | repo-wide | yes |

## Subagents available (Cursor)

Five project-scoped subagents in [`.cursor/agents/`](.cursor/agents/):

- [`code-reviewer`](.cursor/agents/code-reviewer.md) — proactive code review after edits.
- [`api-type-safety-auditor`](.cursor/agents/api-type-safety-auditor.md) — audits new/changed endpoints against `api-type-safety.mdc`.
- [`research-note-validator`](.cursor/agents/research-note-validator.md) — validates research notes against `always-latest-docs` + `research-note-per-module`.
- [`phase-acceptance-validator`](.cursor/agents/phase-acceptance-validator.md) — closes-out a phase via the phase-acceptance issue checklist.
- [`corporate-gifting-domain-auditor`](.cursor/agents/corporate-gifting-domain-auditor.md) — audits RFQ/order/customization/recipient-list invariants.

## Skills available (Cursor)

- [`add-rest-endpoint`](.cursor/skills/add-rest-endpoint/SKILL.md) — walks through adding a Zod-validated NestJS REST endpoint with Better-Auth decorators, outbox event emission, OpenAPI verification, and Kubb regeneration.

## Hard preferences

- **Never** spawn `Task` subagents with `model: "composer-2-fast"` — see [`no-composer-2`](.cursor/rules/no-composer-2.mdc).
- **Never** import another `services/*` module directly — use outbox events or the gateway client. See [`microservice-boundaries`](.cursor/rules/microservice-boundaries.mdc).
- **Never** commit a `.env*` file — see [`secrets-and-secrets-handling`](.cursor/rules/secrets-and-secrets-handling.mdc).
- **Always** open a research note before code in a new package — see [`research-note-per-module`](.cursor/rules/research-note-per-module.mdc).

If you can read this file, you have everything you need to work productively on this repo.
