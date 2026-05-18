# IDE setup

**Audience**: new contributors
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Cursor (primary — recommended)

Cursor automatically loads:
- **15 rules** from `.cursor/rules/*.mdc` — architectural constraints, coding standards
- **1 skill** from `.cursor/skills/add-rest-endpoint/SKILL.md` — guided endpoint creation
- **5 subagents** from `.cursor/agents/` — code-reviewer, api-type-safety-auditor, research-note-validator, phase-acceptance-validator, corporate-gifting-domain-auditor

No extra configuration needed. Open the repo folder in Cursor and it reads everything.

### Cursor settings

The project includes `.cursor/` config. Recommended user settings:

- Enable "Always apply rules" in Cursor settings
- Set Composer model to Claude (not composer-2-fast — see `no-composer-2` rule)

## VS Code (alternative)

VS Code + GitHub Copilot loads:
- **`.github/copilot-instructions.md`** — repo-wide onboarding for Copilot
- **`.github/instructions/*.instructions.md`** — 15 path-scoped instructions (same content as Cursor rules, triggered by `applyTo:` frontmatter)

### Recommended extensions

| Extension | Purpose |
| --------- | ------- |
| `GitHub.copilot` | AI pair programming |
| `GitHub.copilot-chat` | Chat + agents |
| `dbaeumer.vscode-eslint` | Lint on save |
| `esbenp.prettier-vscode` | Format on save |
| `bradlc.vscode-tailwindcss` | N/A (no Tailwind) — **do not install** |
| `ms-vscode.vscode-typescript-next` | Latest TS language features |
| `mongodb.mongodb-vscode` | MongoDB playground |
| `humao.rest-client` | HTTP request testing |
| `redhat.vscode-yaml` | YAML schema validation |

### Workspace settings

The repo ships `.vscode/settings.json` (if present) with:
- Format on save: Prettier
- Default formatter: Prettier
- ESLint auto-fix on save
- TypeScript SDK: workspace version

## Both IDEs — project structure orientation

```
lotusgift/
├── apps/
│   ├── api-gateway/         # NestJS modular monolith (port 3001)
│   ├── web-customer/        # Next.js — retail + corporate buyer (port 3000)
│   ├── web-vendor/          # Next.js — vendor portal (port 3002)
│   ├── web-admin/           # Next.js — admin panel (port 3003)
│   └── web-customer-service/ # Next.js — CS console (port 3004)
├── services/                # 16 NestJS service libraries
├── packages/                # 18 shared workspace packages
├── docs/                    # This documentation tree
├── infrastructure/          # Docker, Oracle, Atlas configs
├── scripts/                 # Bootstrap + codegen scripts
├── .cursor/                 # Cursor rules + skills + agents
└── .github/                 # Workflows, templates, Copilot instructions
```

## Next step

→ [`first-contribution.md`](./first-contribution.md)
