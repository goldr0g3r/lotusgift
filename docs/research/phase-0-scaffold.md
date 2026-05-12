# Phase 0 — Scaffold (PR-1) Research Note

Date: 2026-05-12 (Tuesday)
Phase: P0
Workstream: platform / infra
PR: chore(scaffold) — archive `_old/` + re-scaffold workspace via CLI

This note backs the [P0-scaffold sub-plan](../../.cursor/plans/p0-scaffold_sub-plan_pr-1_d9158dc4.plan.md) and the [parent architecture plan](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md). All citations carry a retrieval date per the `always-latest-docs.mdc` rule (to be committed in PR-2). Versions in section 5 captured from a working `pnpm install` after the scaffold.

## 1. Sources reviewed

| Source | URL | Retrieved | Key finding |
| --- | --- | --- | --- |
| Turborepo with-nestjs example | https://github.com/vercel/turborepo/tree/main/examples/with-nestjs | 2026-05-12 | Actively maintained. Last enhanced Oct 2025 (vercel/turborepo PR #10964). Provides `apps/api` (NestJS) + `apps/web` (Next.js) + `packages/api` (shared types) + `packages/eslint-config` (with Prettier) + `packages/jest-config` + `packages/typescript-config`. |
| Turborepo installation docs | https://turborepo.com/docs/getting-started/installation | 2026-05-12 | `pnpm dlx create-turbo@latest [dir] -e [example]`. Refuses non-empty target (incl. `.git`), so we scaffold in a sibling temp dir and move contents in. |
| create-next-app CLI reference | https://nextjs.org/docs/app/api-reference/cli/create-next-app | 2026-05-12 | 2026 flags used: `--app --typescript --import-alias "@/*" --no-tailwind --eslint --turbopack --use-pnpm --skip-install --disable-git --yes`. `--agents-md` defaults to true (created `AGENTS.md` + `CLAUDE.md` per app). |
| NestJS monorepo mode | https://docs.nestjs.com/cli/monorepo | 2026-05-12 | `nest generate library <name>` would convert apps/api-gateway from standard to monorepo mode (destructive — restructures `src/`). We instead scaffold services as plain pnpm workspace packages exporting NestJS modules. pnpm workspace handles module resolution. |
| nestjs-zod | https://www.npmjs.com/package/nestjs-zod | 2026-05-12 | v5.3.0 (Apr 5 2026). Requires `zod ^3.25.0 || ^4.0.0`. APP_PIPE: `ZodValidationPipe`; APP_INTERCEPTOR: `ZodSerializerInterceptor`; `cleanupOpenApiDoc(doc)` replaces deprecated `patchNestJsSwagger`. Used in PR-4 wiring. |
| Kubb + plugin-react-query | https://www.kubb.dev/blog/v3 | 2026-05-12 | v3 (Sep 2024+), `unplugin-kubb@5.0.14` (Apr 7 2026). TanStack Query v5 only. `@kubb/plugin-react-query` for React. MCP support for Cursor. |
| @thallesp/nestjs-better-auth | https://www.npmjs.com/package/@thallesp/nestjs-better-auth | 2026-05-12 | v2.6.0 (Apr 2026). Requires `better-auth >= 1.5.0`. `@Session() / @AllowAnonymous() / @OptionalAuth()` decorators. Global AuthGuard. Body parser must be disabled, Better-Auth handler mounted before NestJS pipeline. |
| Better-Auth Organization plugin | https://www.better-auth.com/docs/plugins/organization | 2026-05-12 | `organization()` + `organizationClient()`. `organizationHooks` (legacy `organizationCreation` deprecated). Teams, custom roles, `allowUserToCreateOrganization` predicate. |
| posthog-node | https://posthog.com/docs/libraries/node | 2026-05-12 | v5.10+, Node 20+. `new PostHog(token, { host })`. Event naming `[object] [verb]`. Always `await client.shutdown()` in graceful shutdown. |
| Oracle Always Free | https://docs.cloud.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | 2026-05-12 | A1.Flex 4 OCPU + 24 GB RAM ARM. 7-day idle reclaim: 95th-percentile CPU+network+memory < 20%. Mitigated by heartbeat-ping cron every 6h (PR-7). |
| MongoDB Atlas M0 | https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/ | 2026-05-12 | 1 cluster per project. 3 Atlas Search indexes max, 3KB definition cap. < 2M docs / < 10GB indexable. Budget allocated to `products`, `vendors`, `orders`. |
| GitHub Copilot custom instructions | https://docs.github.com/en/copilot/customizing-copilot/adding-repository-custom-instructions-for-github-copilot | 2026-05-12 | `.github/copilot-instructions.md` (repo-wide), `.github/instructions/<name>.instructions.md` with `applyTo:` glob, `AGENTS.md` (nearest-wins). Set up in PR-2. |
| GitHub free plan limits | https://docs.github.com/en/get-started/learning-about-github/githubs-plans | 2026-05-12 | Free private repos have LIMITED feature set (no branch protection, no CODEOWNERS, no Rulesets). PUBLIC repos on free unlock all these. Decided in setup: repo `goldr0g3r/lotusgift` flipped to public. |
| GitHub Projects v2 + PAT scopes | https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens | 2026-05-12 | Fine-grained PATs don't expose user-level `Projects` permission. Classic PAT with `project` scope is required for personal Projects v2 access. |

## 2. Decisions log

| Decision | Chose | Rejected | Reasoning |
| --- | --- | --- | --- |
| Scaffold approach | CLI only (`create-turbo`, `create-next-app`, custom tsx script) | Hand-rolled `package.json` / `tsconfig` | Reproducible; CLI captures latest stable versions automatically. User directive: "create everything here from scratch using CLI only". |
| Archive folder name | `_old/` at repo root | `legacy/` (nursery-plan default), separate git branch | User chose `_old/`. Stays in source control as reference; excluded from pnpm workspace traversal via `_old/**` ESLint ignore. |
| Repo visibility | PUBLIC (`goldr0g3r/lotusgift`) | Private + Pro upgrade ($4/mo), private + stay-free | User chose public — unlocks free unlimited Actions minutes, branch protection, CODEOWNERS, Rulesets. |
| Apps split | 4 separate Next.js apps (web-customer, web-vendor, web-admin, web-customer-service) | Single Next.js with route segments | User chose 4 apps for isolation + independent deploy. Adds 1 NestJS app (api-gateway) for total 5 apps. |
| Service location | `services/<name>/` as plain pnpm workspace packages | `nest g library` into `apps/api-gateway/libs/` | `nest g library` would convert api-gateway from standard to monorepo mode and restructure its `src/` (destructive). Plain pnpm workspace packages exporting NestJS modules give the same import ergonomics (`import { AuthServiceModule } from '@lotusgift/auth-service'`) without restructuring. |
| Service prefix | `@lotusgift/*` | `@app/*` (NestJS default), `@repo/*` (used for shared packages) | Domain identity ("LotusGift services") distinct from shared infra packages (`@repo/*`). |
| Package prefix | `@repo/*` | `@lotusgift/*` | Matches Turborepo convention from the with-nestjs scaffold. |
| Tailwind in Next apps | NO (`--no-tailwind`) | YES (Next default in 2026) | Parent plan section 5 — design system is Radix Primitives + CSS Modules + Sass + `@repo/design-tokens`, NOT Tailwind. |
| Skip install during create-next-app | YES (`--skip-install`) | NO | Faster scaffold; single `pnpm install` at root captures all apps. |
| Disable git in create-next-app | YES (`--disable-git`) | NO | We're inside an existing git repo (`goldr0g3r/lotusgift`); per-app `.git` would shadow it. |
| `AGENTS.md` per app | KEEP (default `--agents-md`) | Disable | Per-app `AGENTS.md` documents app-specific scripts. Repo-root consolidated `AGENTS.md` added in PR-2 alongside copilot-instructions. |
| Next/font/google in 3 new apps | REMOVED for PR-1 (use system fonts) | Keep | Build-time fetch to Google Fonts was blocked by proxy in our network. PR-6 (design system) installs proper LotusGift fonts (Plus Jakarta + local Geist woff) per parent plan section 5. |
| Branch protection in PR-1 | DEFER to PR-4 | Apply now | PR-1 lands the scaffold; CI checks and branch protection rules come in PR-4 with `.github/workflows/`. |
| ESLint flat-config ignores | base.js ignores `node_modules/**`, `.next/**`, `.turbo/**`, `_old/**`, `next-env.d.ts`, `coverage/**`, `dist/**` | Default (`dist/**` only) | Without these, `eslint .` recurses into Next.js build output emitting thousands of false-positive warnings. |

## 3. Open questions (parked for future phases)

- **AGENTS.md scope**: per-app `AGENTS.md` from `create-next-app` kept. Repo-root `AGENTS.md` added in PR-2 alongside `.github/copilot-instructions.md`. Decided in PR-2.
- **NestJS CLI builder**: default is webpack in monorepo mode (per nest docs). Consider switching to `swc` later for faster builds. Decided in P4 or later.
- **`packages/ui` initial content**: kept create-turbo's example button/card/code components. PR-6 replaces with Radix + CSS Modules + Sass + Lucide LotusGift design system.
- **`packages/api` initial content**: kept create-turbo's example Links DTO. PR-4 replaces with Kubb-generated TanStack Query hooks.
- **`apps/api-gateway` initial content**: kept create-turbo's example Links module. P4 strips it down to the modular monolith shell that mounts the 16 services.

## 4. Implementation checklist

- [x] Pre-flight: PATH refresh + proxy env + `gh auth status` + verified Projects v2 #9 + 4 custom fields (Phase / Workstream / Layer / Type) at `users/goldr0g3r/projects/9`.
- [x] `git checkout -b pr-1-archive-scaffold`.
- [x] Archive: every top-level item except `.git` / `.cursor` / `.github` moved to `_old/`. Git tracked as renames at 100% similarity.
- [x] `create-turbo@latest .lotusgift-scaffold-tmp -e with-nestjs --package-manager pnpm --skip-install` then moved contents into repo root.
- [x] Renamed `apps/api` → `apps/api-gateway`, `apps/web` → `apps/web-customer`. Updated package.json names + ports + `packageManager: "pnpm@9.0.0"`.
- [x] `create-next-app@latest` for `web-vendor`, `web-admin`, `web-customer-service` with the documented flags. Per-app `pnpm-workspace.yaml` merged into root.
- [x] Wrote `scripts/scaffold-package.ts` (handles `package` and `service` kinds; ESM, no external deps).
- [x] Generated 16 services via `pnpm dlx tsx scripts/scaffold-package.ts service <name>`. Each with NestJS module skeleton + workspace package.json.
- [x] Generated 13 new packages via `pnpm dlx tsx scripts/scaffold-package.ts package <name>`. `packages/ui` was already in scaffold (kept).
- [x] `pnpm install` succeeded (858 packages, 1m 56s).
- [x] `pnpm build` succeeded (7/7 tasks) after fixing `@repo/api` definite-assignment + removing `next/font/google` from 3 new apps.
- [x] `pnpm lint` succeeded (36/36 tasks) after adding broad ESLint ignores to base.js and fixing `web-customer` lint script (`next lint --max-warnings 0` → `eslint . --max-warnings 0`).
- [ ] Smoke `pnpm dev` for 30s, check api-gateway on :3001 + web-customer on :3000.
- [ ] Update root README + verify `.gitignore`.
- [ ] Commit, push branch, open PR via MCP, status-sync after merge.

## 5. Versions installed

Captured 2026-05-12 from `pnpm install` and individual package.json files:

| Package | Version | Notes |
| --- | --- | --- |
| node | v22.14.0 | Local runtime |
| pnpm | 9.0.0 | Local + `packageManager` field |
| turbo | 2.9.12 | Workspace root devDep |
| typescript | ~5.5 / 5.8 / 5.9 | Hoisted; each package declares its own; consolidated in PR-4 |
| next | 16.2.0 (web-customer from create-turbo) | newer 16.2.6 in web-vendor / web-admin / web-customer-service from create-next-app |
| react | ^19.1.0 / 19.2.4 | Same pattern (web-customer older, new apps newer) |
| @nestjs/core | ^11.1.11 | api-gateway |
| @nestjs/cli | ^11.0.14 | api-gateway devDep |
| @nestjs/common | ^11.1.11 | api-gateway |
| reflect-metadata | ^0.2.2 | api-gateway |
| rxjs | ^7.8.2 | api-gateway |
| eslint | ^9.31.0 / ^9.39.2 | Various packages |

Note version drift between web-customer (older Next) and the 3 new web-* apps (newer Next). PR-6 (design system) will unify all 4 web apps to the same Next + React version.

## 6. Implementation reference

- PR URL: https://github.com/goldr0g3r/lotusgift/pull/1
- Merged at: 2026-05-12 (squash merge `7d50829`)
- Commits (pre-squash):
  - `95d53d4` archive current code to `_old/` (234 git renames at 100% similarity)
  - `bd9aa11` re-scaffold via `create-turbo -e with-nestjs`
  - `fb61c6b` rename `apps/api` → `apps/api-gateway`, `apps/web` → `apps/web-customer`, root name + `packageManager: pnpm@9.0.0`
  - `0d5b589` add `web-vendor` + `web-admin` + `web-customer-service` via `create-next-app@latest`
  - `12a217e` add `scripts/scaffold-package.ts` + 16 services + 13 packages
  - `55e0610` `pnpm install` + build/lint fixes + research note
  - `d50a593` LotusGift v2 README
- CI run: not yet (CI starts after PR-4 lands)
- Projects v2 board item: `PVTI_lAHOB9XnOc4BXcKjzgseqK4` on project #9 — Status `Done`, Phase `P0`, Workstream `infra`, Layer `L0`, Type `chore`.
