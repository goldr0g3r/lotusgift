# CLAUDE.md — LotusGift v2

This file is the entry point for **Claude Code** (and other Anthropic-based coding agents) working on this repo. It mirrors [`AGENTS.md`](AGENTS.md) so the agentsmd.net nearest-wins lookup picks up either file.

## Read these in order

1. **Project overview, build commands, validation steps, architecture** → [`.github/copilot-instructions.md`](.github/copilot-instructions.md). Same content GitHub Copilot loads.
2. **Path-specific rules** → [`.cursor/rules/`](.cursor/rules/) (Cursor format) or [`.github/instructions/`](.github/instructions/) (Copilot format). Both are 1:1 mirrors.
3. **Parent plan** → [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) for the 22-phase roadmap and architectural rationale.
4. **Research notes** → [`docs/research/`](docs/research/) — every dependency choice has a retrieval-dated citation here.

For the full rule index, subagent list, and skills list, see [`AGENTS.md`](AGENTS.md). The two files are intentionally synchronized — single content, two filenames.

## Hard preferences

- **Never** spawn subagents with `model: "composer-2-fast"` — see [`.cursor/rules/no-composer-2.mdc`](.cursor/rules/no-composer-2.mdc).
- **Never** import another `services/*` module directly — use outbox events or the gateway client.
- **Never** commit a `.env*` file.
- **Always** open a research note before code in a new package.

If you can read this file, you have everything you need to work productively on this repo.
