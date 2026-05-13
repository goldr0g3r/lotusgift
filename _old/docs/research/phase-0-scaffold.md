# Phase 0 — Scaffold (PR-1) Research Note

Date: 2026-05-12 (Tuesday)
Phase: P0
Workstream: platform / infra
PR: chore(scaffold) — archive `_old/` + re-scaffold workspace via CLI

This note backs the [P0-scaffold sub-plan](../../.cursor/plans/p0-scaffold_sub-plan_pr-1_d9158dc4.plan.md) and the [parent architecture plan](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md). All citations carry a retrieval date per the `always-latest-docs.mdc` rule (to be committed in PR-2). Versions are captured from `pnpm ls --depth=0 --json` AFTER `pnpm install` and stored in `§5 Versions installed` below.

## 1. Sources reviewed

| Source | URL | Retrieved | Key finding |
| --- | --- | --- | --- |
| Turborepo with-nestjs example | https://github.com/vercel/turborepo/tree/main/examples/with-nestjs | 2026-05-12 | Actively maintained. Last enhanced Oct 2025 (vercel/turborepo PR #10964). Provides `apps/api` (NestJS) + `apps/web` (Next.js) + `packages/api` (shared types) + `packages/eslint-config` (with Prettier) + `packages/jest-config` + `packages/typescript-config`. |
| Turborepo installation docs | https://turborepo.com/docs/getting-started/installation | 2026-05-12 | `pnpm dlx create-turbo@latest [dir] -e [example]`. Refuses non-empty target (incl. `.git`), so we scaffold in a sibling temp dir and move contents in. |
| create-next-app CLI reference | https://nextjs.org/docs/app/api-reference/cli/create-next-app | 2026-05-12 | 2026 flags used: `--app --typescript --src-dir --import-alias "@/*" --no-tailwind --eslint --turbopack --use-pnpm --skip-install --disable-git --yes`. `--agents-md` defaults to true (creates `AGENTS.md` + `CLAUDE.md` per app). |
| NestJS monorepo mode | https://docs.nestjs.com/cli/monorepo | 2026-05-12 | `nest generate library <name>` adds project to `libs/<name>` by default + updates `nest-cli.json` (`monorepo: true`, registers under `projects`). We `git mv libs services` after generation. |
| nestjs-zod | https://www.npmjs.com/package/nestjs-zod | 2026-05-12 | v5.3.0 (Apr 5 2026). Requires `zod ^3.25.0 || ^4.0.0`. APP_PIPE: `ZodValidationPipe`; APP_INTERCEPTOR: `ZodSerializerInterceptor`; `cleanupOpenApiDoc(doc)` replaces deprecated `patchNestJsSwagger`. Used in PR-4 wiring. |
| Kubb + plugin-react-query | https://www.kubb.dev/blog/v3 | 2026-05-12 | v3 (Sep 2024+), `unplugin-kubb@5.0.14` (Apr 7 2026). TanStack Query v5 only. `@kubb/plugin-react-query` for React. MCP support for Cursor. |
| @thallesp/nestjs-better-auth | https://www.npmjs.com/package/@thallesp/nestjs-better-auth | 2026-05-12 | v2.6.0 (Apr 2026). Requires `better-auth >= 1.5.0`. `@Session() / @AllowAnonymous() / @OptionalAuth()` decorators. Body parser must be disabled, Better-Auth handler mounted before NestJS pipeline. |
| Better-Auth Organization plugin | https://www.better-auth.com/docs/plugins/organization | 2026-05-12 | `organization()` + `organizationClient()`. `organizationHooks` (legacy `organizationCreation` deprecated). Teams, custom roles, `allowUserToCreateOrganization` predicate. |
| posthog-node | https://posthog.com/docs/libraries/node | 2026-05-12 | v5.10+, Node 20+. `new PostHog(token, { host })`. Event naming `[object] [verb]`. Always `await client.shutdown()` in graceful shutdown. |
| Oracle Always Free | https://docs.cloud.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | 2026-05-12 | A1.Flex 4 OCPU + 24 GB RAM ARM. 7-day idle reclaim: 95th-percentile CPU+network+memory < 20%. Mitigated by heartbeat-ping cron every 6h (PR-7). |
| MongoDB Atlas M0 | https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/ | 2026-05-12 | 1 cluster per project. 3 Atlas Search indexes max, 3KB definition cap. < 2M docs / < 10GB indexable. Budget allocated to `products`, `vendors`, `orders`. |
| GitHub Copilot custom instructions | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | 2026-05-12 | `.github/copilot-instructions.md` (repo-wide), `.github/instructions/<name>.instructions.md` with `applyTo:` glob, `AGENTS.md` (nearest-wins). Set up in PR-2. |
| GitHub free plan limits | https://docs.github.com/en/get-started/learning-about-github/githubs-plans | 2026-05-12 | Free private repos have LIMITED feature set (no branch protection, no CODEOWNERS, no Rulesets). PUBLIC repos on free unlock all these. Decided in setup: repo `goldr0g3r/lotusgift` flipped to public. |
| GitHub Projects v2 + PAT scopes | https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens | 2026-05-12 | Fine-grained PATs don't expose user-level `Projects` permission. Classic PAT with `project` scope is required for personal Projects v2 access. User created classic PAT with `project` scope (May 12, 2026). |

## 2. Decisions log

| Decision | Chose | Rejected | Reasoning |
| --- | --- | --- | --- |
| Scaffold approach | CLI only (`create-turbo`, `create-next-app`, `nest g library`, custom tsx script) | Hand-rolled `package.json` / `tsconfig` | Reproducible; CLI captures latest stable versions automatically; user directive "create everything here from scratch using CLI only". |
| Archive folder name | `_old/` at repo root | `legacy/` (nursery-plan default), separate git branch | User chose `_old/`. Stays in source control as reference; excluded from pnpm workspace traversal. |
| Repo visibility | PUBLIC (`goldr0g3r/lotusgift`) | Private + Pro upgrade ($4/mo), private + stay-free | User chose public — unlocks free unlimited Actions minutes, branch protection, CODEOWNERS, Rulesets. |
| Apps split | 4 separate Next.js apps (web-customer, web-vendor, web-admin, web-customer-service) | Single Next.js with route segments | User chose 4 apps for isolation + independent deploy. Adds 1 NestJS app (api-gateway) for total 5 apps. |
| NestJS lib location | `services/<name>/` (after `git mv libs services`) | Default `libs/<name>/` | Matches nursery-plan + parent-plan §4 workspace layout. Reflects "service" semantics over generic "library". |
| NestJS lib prefix | `@lotusgift` | `@app` (NestJS default), `@repo` (Turborepo default) | Matches pnpm workspace package.json `name` convention (`@lotusgift/auth-service`). Avoids confusion with `@repo/*` which is reserved for shared packages. |
| Tailwind in Next apps | NO (`--no-tailwind`) | YES (Next default in 2026) | Parent plan §5 — design system is Radix Primitives + CSS Modules + Sass + `@lotusgift/design-tokens`, NOT Tailwind. |
| Skip install during create-next-app | YES (`--skip-install`) | NO | Faster scaffold; single `pnpm install` at root captures all apps. |
| Disable git in create-next-app | YES (`--disable-git`) | NO | We're inside an existing git repo (`goldr0g3r/lotusgift`); per-app `.git` would shadow it. |
| `AGENTS.md` per app | KEEP (default `--agents-md`) | Disable | Per-app `AGENTS.md` documents app-specific scripts. Repo-root consolidated `AGENTS.md` added in PR-2 alongside copilot-instructions. |
| Branch protection in PR-1 | DEFER to PR-4 | Apply now | PR-1 lands the scaffold; CI checks and branch protection rules come in PR-4 with `.github/workflows/`. |

## 3. Open questions (parked for future phases)

- **AGENTS.md scope**: keep per-app AGENTS.md generated by `create-next-app`? Recommend yes — they document app-specific scripts. Decided in PR-2.
- **pnpm version pin**: lock to whatever `create-turbo` emits, or override via `packageManager` field in root `package.json`? Decided in PR-1 implementation.
- **NestJS CLI builder**: default is webpack in monorepo mode (per nest docs). Consider switching to `swc` later for faster builds. Decided in P4 or later.

## 4. Implementation checklist (mirrors the sub-plan's §3 steps)

- [ ] Pre-flight: PATH refresh + proxy env + `gh auth status` + verify Projects v2 #9 + 4 custom fields.
- [ ] `git checkout -b pr-1-archive-scaffold`.
- [ ] Archive: `git mv` every top-level item except `.git` / `.cursor` / `.github` into `_old/`.
- [ ] `create-turbo@latest .lotusgift-scaffold-tmp -e with-nestjs --package-manager pnpm` then move contents into repo root.
- [ ] Rename `apps/api` → `apps/api-gateway`, `apps/web` → `apps/web-customer`. Update package.json name fields.
- [ ] `create-next-app@latest` for `web-vendor`, `web-admin`, `web-customer-service` with the documented flags.
- [ ] Write `scripts/scaffold-package.ts` and `scripts/relocate-nest-libraries.ts` (tsx-runnable).
- [ ] `nest generate library` × 16 then `pnpm dlx tsx scripts/relocate-nest-libraries.ts` to move `libs/` → `services/` + fix paths.
- [ ] `pnpm dlx tsx scripts/scaffold-package.ts` × 14 for new packages.
- [ ] `pnpm install`, `pnpm build`, `pnpm lint`, capture versions in §5 below.
- [ ] Smoke `pnpm dev` for 30s, check api-gateway on :3001 + web-customer on :3000.
- [ ] Update root README + verify `.gitignore` covers `.next` / `dist` / `node_modules` / `.turbo` / `.env*`.
- [ ] Commit, push branch, open PR via MCP, status-sync after merge.

## 5. Versions installed

Filled in after `pnpm install` completes. Captured via:

```powershell
pnpm ls --depth=0 --json --recursive > docs/research/phase-0-scaffold.versions.json
```

The summary table (key packages):

| Package | Version | Source |
| --- | --- | --- |
| turbo | TBD | `pnpm ls` after install |
| next | TBD | `pnpm ls` after install in each web-* app |
| @nestjs/core | TBD | `pnpm ls` after install in api-gateway |
| @nestjs/cli | TBD | dev dep in api-gateway |
| typescript | TBD | shared via `@lotusgift/typescript-config` |
| pnpm | TBD | `pnpm --version` |
| node | TBD | `node --version` |

## 6. Implementation reference

Filled in after PR is merged:

- PR URL: TBD
- Merged at: TBD
- CI run: TBD (CI starts after PR-4 lands)
