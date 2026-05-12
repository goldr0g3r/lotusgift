# Phase-0 Research Note — Rules, Skills, Subagents

**Phase:** 0 (foundation)
**Topic:** Cursor rules, Copilot instructions, agent skills, subagents
**Owner:** @goldr0g3r
**Status:** Implementation in progress
**Sub-plan:** [.cursor/plans/p0-rules_sub-plan_pr-1_7316f54c.plan.md](../../.cursor/plans/p0-rules_sub-plan_pr-1_7316f54c.plan.md)
**Parent plan:** [.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

## 1. Goal

Ship the persistent guidance layer for the LotusGift v2 monorepo before any product code lands: every `.cursor/rules/*.mdc` rule, the `.github/instructions/*.instructions.md` Copilot mirrors, the repo-wide `.github/copilot-instructions.md`, an `AGENTS.md` pointer for non-Copilot agents (Cursor agents, Claude Code, Codex, etc.), one `.cursor/skills/add-rest-endpoint` skill, and five `.cursor/agents/*.md` subagents.

This is the canonical research note; every shipped rule cites this file in its **References** section to satisfy the `always-latest-docs.mdc` rule on day one.

## 2. Retrieval-dated citations (all verified May 12, 2026)

| # | Topic | Title / Page | URL | Retrieved | Notes |
|---|-------|--------------|-----|-----------|-------|
| 1 | Copilot custom instructions | Adding repository custom instructions for GitHub Copilot | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | 2026-05-12 | Three formats: repo-wide `.github/copilot-instructions.md`, path-specific `.github/instructions/<name>.instructions.md` with `applyTo:` glob frontmatter and optional `excludeAgent:` key, agent `AGENTS.md` (nearest-wins lookup). |
| 2 | nestjs-zod | nestjs-zod v5.3.0 on npm | https://www.npmjs.com/package/nestjs-zod | 2026-05-12 | Published Apr 5 2026. `npx nestjs-zod-cli` for setup. APP_PIPE `ZodValidationPipe`, APP_INTERCEPTOR `ZodSerializerInterceptor`, optional APP_FILTER for `ZodSerializationException`. Requires `zod ^3.25.0 \|\| ^4.0.0`. Use `cleanupOpenApiDoc(doc)` before `SwaggerModule.setup()` (replaces deprecated `patchNestJsSwagger`). |
| 3 | Kubb v3 | Kubb — OpenAPI to TypeScript code generator | https://kubb.dev/ | 2026-05-12 | `unplugin-kubb@5.0.14` (Apr 7 2026). TanStack Query v5 only. `npx kubb init` + `npx kubb generate`. Framework packages: `@kubb/plugin-react-query`, `@kubb/plugin-svelte-query`, etc. Has MCP support for Cursor. |
| 4 | nestjs-better-auth | @thallesp/nestjs-better-auth v2.6.0 on npm | https://www.npmjs.com/package/@thallesp/nestjs-better-auth | 2026-05-12 | Published Apr 2026. Requires `better-auth >= 1.5.0`. Decorators: `@Session()`, `@AllowAnonymous()`, `@OptionalAuth()`. Global AuthGuard. Body parser must be disabled, Better-Auth handler mounted before NestJS pipeline. |
| 5 | Better-Auth Organization | Organization plugin docs | https://www.better-auth.com/docs/plugins/organization | 2026-05-12 | `organization()` server plugin + `organizationClient()`. `organizationHooks` (the legacy `organizationCreation` hook is deprecated). Supports teams, custom roles, `allowUserToCreateOrganization` boolean / async predicate. |
| 6 | PostHog Node SDK | PostHog Node.js docs | https://posthog.com/docs/libraries/node | 2026-05-12 | `posthog-node` v5.10+, Node 20+. `new PostHog(token, { host })`. `client.capture({ distinctId, event, properties })`. `client.alias({ distinctId, alias })`. Event naming convention `[object] [verb]`. `$set` / `$set_once` for person properties. Always `await client.shutdown()` in serverless and graceful shutdown paths. |
| 7 | Oracle Always Free | Oracle Cloud Always Free Resources | https://docs.cloud.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | 2026-05-12 | A1.Flex 4 OCPU + 24 GB RAM ARM (Mumbai region available). 7-day idle reclaim policy: 95th-percentile CPU + network + memory < 20% triggers reclaim. Mitigated by heartbeat-ping cron every 6h. |
| 8 | MongoDB Atlas M0 | Free shared cluster limitations | https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/ | 2026-05-12 | 1 cluster per project. ~512MB storage per cluster. Limited connections. |
| 9 | Atlas Search on M0 | Atlas Search feature compatibility | https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/ | 2026-05-12 | M0 supports Atlas Search with **3 search indexes max**, 3KB definition cap. < 2M docs / < 10GB indexable. |
| 10 | Cursor rule format | Skills-cursor `create-rule/SKILL.md` (workspace-attached) | local skill | 2026-05-12 | `.mdc` files in `.cursor/rules/` with `description` / `globs` / `alwaysApply` frontmatter. Under 50 lines. Concrete examples preferred. |
| 11 | Cursor subagent format | Skills-cursor `create-subagent/SKILL.md` (workspace-attached) | local skill | 2026-05-12 | `.cursor/agents/<name>.md` with `name` + `description` frontmatter. Description drives delegation. |
| 12 | Cursor skill format | Skills-cursor `create-skill/SKILL.md` (workspace-attached) | local skill | 2026-05-12 | `.cursor/skills/<name>/SKILL.md` with `name` + `description` + optional `disable-model-invocation` frontmatter. SKILL.md ≤500 lines. |

## 3. Decisions log

| # | Decision | Chose | Rejected | Reasoning |
|---|----------|-------|----------|-----------|
| D1 | Rule format | Cursor `.mdc` + Copilot `.instructions.md` mirrors | Single-format only | Both Cursor and Copilot agents work on this repo; one source of truth (the `.mdc`) is mirrored to keep Copilot in lockstep. |
| D2 | Rules size cap | ≤50 lines per `create-rule` skill | Long monolithic rules | Tight rules render in the IDE rule picker; longer-form context belongs in research notes and runbooks. |
| D3 | `excludeAgent: "code-review"` on process rules | Yes, on `research-note-per-module`, `design-discovery`, `always-latest-docs` | Apply to every PR review | These are workflow rules, not code patterns; flagging every PR for missing research notes from the code-review agent would noise up the review surface. |
| D4 | `AGENTS.md` + `CLAUDE.md` at root | Yes, both | `AGENTS.md` only | Single content, two filenames — covers Cursor agents, Claude Code, Codex, and other agents that follow the agentsmd/agents.md nearest-wins lookup. |
| D5 | Skill location | Project `.cursor/skills/add-rest-endpoint/` | User `~/.cursor/skills/` | Project-scoped so the team and CI share the workflow. |
| D6 | Subagent location | Project `.cursor/agents/` | User-level | Project-scoped (overrides user-level when both exist). |
| D7 | `no-composer-2.mdc` naming | Keep specific name | Broader `subagent-model-policy.mdc` | Specific name is grep-able and discoverable; future model policies get their own rule. |
| D8 | Replace `add-trpc-endpoint` skill | Yes — `add-rest-endpoint` (NestJS REST + Zod + Kubb) | Keep tRPC | This codebase is NestJS REST per ADR-002 (parent plan §6); tRPC is out of scope. |

## 4. Open questions

None blocking. Sub-plan §5 open questions all resolved as "recommend yes" for: `excludeAgent` on process rules, `CLAUDE.md` mirror of `AGENTS.md`, project-scoped skill, project-scoped subagents, `no-composer-2.mdc` specific name.

## 5. Implementation checklist

- [x] Research note committed (this file)
- [x] All 15 `.cursor/rules/*.mdc` rules
- [x] All 15 `.github/instructions/*.instructions.md` mirrors
- [x] `.github/copilot-instructions.md`
- [x] `AGENTS.md` + `CLAUDE.md` at repo root
- [x] `.cursor/skills/add-rest-endpoint/SKILL.md`
- [x] 5 subagents in `.cursor/agents/`
- [x] `pnpm lint` clean
- [x] Shipped to `main` (see Implementation reference below — work merged via PR #1's follow-up commits, not a separate p0-rules PR)

## 6. Versions (locked at PR-1 scaffold time, refresh before code phases)

Versions for the libraries cited above will be locked into `pnpm-lock.yaml` at PR-1 (`chore(scaffold)`) and printed via `pnpm ls --depth=0` into a follow-up section here. Until then, treat the npm-published latest as authoritative — every value above came from the live registry / docs page on May 12, 2026.

## 7. Implementation reference

Shipped to `main` across two commits (no separate p0-rules PR — work was folded into PR #1's follow-up commit chain and then completed via a second direct-to-main commit):

- [`55e0610`](https://github.com/goldr0g3r/lotusgift/commit/55e0610) (feature branch) — `chore(scaffold): pnpm install + fix build (definite assignment, fonts) + fix lint (ignores, --max-warnings) + research note` — included this research note + 4 rules (`api-type-safety`, `deployment-mode`, `design-discovery`, `research-note-per-module`) + 4 mirrors. Squash-merged into `main` as part of PR #1.
- [`7d50829`](https://github.com/goldr0g3r/lotusgift/commit/7d50829fe80fb86e746cc2be8dd3dbd7c5610570) — squash-merge of PR [#1](https://github.com/goldr0g3r/lotusgift/pull/1) `chore(scaffold): archive _old/ + re-scaffold workspace via CLI` onto `main`.
- [`dacbbbb`](https://github.com/goldr0g3r/lotusgift/commit/dacbbbb9e8fa53781b105c3761306fb724ab1dfd) — `docs(research): update phase-0-scaffold documentation with implementation details and references` — direct-to-main commit (no PR) that added the remaining 11 rules + 5 subagents + 1 skill + 15 Copilot instruction mirrors + `.github/copilot-instructions.md` + `AGENTS.md` + `CLAUDE.md`. The commit message references "phase-0-scaffold" but the actual contents are PR-2 rules+governance (see `docs/research/phase-0-scaffold.md` section 6 footnote).

### Retro-sync governance (PR-2 follow-up)

Tracked in [`p0-rules_retro-sync_governance_032648dd.plan.md`](../../.cursor/plans/p0-rules_retro-sync_governance_032648dd.plan.md). Executed 2026-05-12 and finalised via PR [#6](https://github.com/goldr0g3r/lotusgift/pull/6) (squash [`9b2a4811`](https://github.com/goldr0g3r/lotusgift/commit/9b2a48115792f578f488d7e256c5b58b0dac8b18)):

- 23 milestones created (#1 `Phase 0 - Foundation Reset` through #23 `Phase 22 - Launch`).
- 52 labels created (10 `type/*` + 23 `phase/*` + 4 `prio/*` + 5 `area/*` + 10 special).
- Phase-0 issues opened:
  - [#3 Phase 0 — Research Note](https://github.com/goldr0g3r/lotusgift/issues/3) — `state: closed`, `state_reason: completed`.
  - [#4 Phase 0 — Epic: Foundation Reset](https://github.com/goldr0g3r/lotusgift/issues/4) — open; tracks all P0 deliverables.
  - [#5 Phase 0 — Phase Acceptance](https://github.com/goldr0g3r/lotusgift/issues/5) — open; acceptance checklist with first 5 items ticked.
- All 3 issues added to Projects v2 board #9 with `Phase: P0`, `Layer: L0` set; Status/Workstream/Type as appropriate.
- Parent plan `p0-rules` + `p0-issues` todos both marked `status: completed` with explanatory notes.
- This sub-plan's 28 frontmatter todos all `status: completed`.

### Per-file verification (2026-05-12)

All file artefacts in `dacbbbb` + `55e0610` were verified against this sub-plan's spec on 2026-05-12. No deviations.

| Group | Count | Files | Line range | Spec compliance |
| --- | --- | --- | --- | --- |
| `.cursor/rules/*.mdc` | 15 | always-latest-docs, analytics-instrumentation, api-type-safety, architecture-layers, commit-conventions, corporate-gifting-domain, deployment-mode, design-discovery, event-driven-discipline, free-tier-budget, microservice-boundaries, no-composer-2, research-note-per-module, secrets-and-secrets-handling, test-coverage | 21–36 | All ≤50 lines per create-rule skill; frontmatter complete; References cite this note |
| `.cursor/agents/*.md` | 5 | api-type-safety-auditor, code-reviewer, corporate-gifting-domain-auditor, phase-acceptance-validator, research-note-validator | 52–71 | `name` + `description` frontmatter; system prompts with workflow + checklists |
| `.cursor/skills/add-rest-endpoint/SKILL.md` | 1 | add-rest-endpoint | 158 | ≤500 lines per create-skill skill; `disable-model-invocation: true` |
| `.github/instructions/*.instructions.md` | 15 | one mirror per rule | 21–34 | `applyTo:` frontmatter (correctly converted from `globs:` / `alwaysApply: true`) |
| `.github/copilot-instructions.md` | 1 | repo-wide instructions | 68 | ≤2 pages per GitHub recommendation |
| `AGENTS.md` | 1 | root agents pointer | 40 | Pointer to copilot-instructions + rule index |
| `CLAUDE.md` | 1 | Claude Code mirror | 14 | Symlink-equivalent of AGENTS.md |
