# LotusGift v2 documentation

**Audience**: every contributor + every coding agent
**Phase**: P0 (Foundation Reset) — onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

> One docs tree for the LotusGift v2 multi-vendor corporate gifting marketplace (India market). Browse by intent: setup, how-to, deployment, runbook, decision, research, design, security, glossary, API.

---

## I want to…

### …get the repo running locally

→ [`getting-started/`](./getting-started/README.md) — Prerequisites, clone-to-`pnpm dev` walkthrough, Docker alternative, IDE setup, first contribution, troubleshooting.

### …perform a specific workflow

→ [`how-to/`](./how-to/README.md) — One page per recipe: open an ADR, open a research note, open a Design Discovery, open a PR, open an issue, set project fields, add a service, add a REST endpoint, close a phase.

### …understand or operate production infrastructure

→ [`deployment/`](./deployment/README.md) — Step-by-step provisioning: Oracle Always Free VM, MongoDB Atlas M0, Upstash Redis, Cloudflare R2, Vercel (4 apps), Razorpay live, Resend + MSG91, PostHog Cloud EU, Sentry, Grafana Cloud, domain + SSL, CI/CD, soft-launch checklist.

### …respond to a recurring operational situation

→ [`runbooks/`](./runbooks/README.md) — Project views setup (manual), GitHub setup, local development, Oracle deploy, incident response, free-tier burn tracking, going-to-production checklist, scaling up, backup/restore.

### …understand a past architectural decision

→ [`adr/`](./adr/README.md) — 7 ADRs (`0001` … `0007`), the ADR template, and the naming convention.

### …read or write a phase research note

→ [`research/`](./research/README.md) — Phase research notes (P0 → P8 complete, P9+ pending), retrieval-dated citations, decisions logs.

### …propose or implement a frontend page family

→ [`design/`](./design/DESIGN.md) — Design Discovery workflow, brand tokens, page-family wireframes.

### …work on something security-sensitive

→ [`security/`](./security/README.md) — Threat model, role + permission matrix, data classification, PCI/payment security posture.

### …look up a domain term

→ [`glossary/`](./glossary/README.md) — Corporate gifting terms, Indian regulatory terms, tech acronyms.

### …consume or extend the REST API

→ [`api/`](./api/README.md) — The OpenAPI 3.1 → Kubb → TanStack Query pipeline; how to regenerate `@repo/api`.

### …understand analytics instrumentation

→ [`analytics/`](./analytics/events.md) — Event taxonomy, `[object] [verb]` naming, PostHog wrapper-only policy.

---

## Structure at a glance

```
docs/
├── README.md                  ← you are here
├── adr/                      ← Architecture Decision Records (7 + template)
├── research/                 ← per-phase research notes (P0–P8 done, P9+ pending)
├── design/                   ← Design Discoveries + wireframes
├── api/                      ← OpenAPI snapshot + CHANGELOG (future)
├── analytics/                ← Event taxonomy
├── architecture/             ← Cross-service contracts + dep graph
├── getting-started/          ← Onboarding (clone → dev)
├── how-to/                   ← Task recipes
├── deployment/               ← Production provisioning
├── runbooks/                 ← Operational procedures
├── security/                 ← Threat model + role matrix + classification
└── glossary/                 ← Corporate gifting + Indian regulatory + tech terms
```

## Authoring discipline

Every doc in this tree carries a 4-line header:

```markdown
**Audience**: <who reads this>
**Phase**: <when this becomes load-bearing — P0 / P5 / P22>
**Last reviewed**: <YYYY-MM-DD>
**Owner**: <@goldr0g3r per .github/TEAM.md>
```

Every external citation carries a `— retrieved YYYY-MM-DD` suffix per [`.cursor/rules/always-latest-docs.mdc`](../.cursor/rules/always-latest-docs.mdc). Per-file LOC target is ≤500 lines — split rather than grow.

## See also

- [`../README.md`](../README.md) — repo-level overview + status.
- [`../AGENTS.md`](../AGENTS.md) — coding-agent rules of engagement.
- [`../.github/TEAM.md`](../.github/TEAM.md) — roster + assignee routing.
- [`../.github/copilot-instructions.md`](../.github/copilot-instructions.md) — Copilot-specific guidance.
- [`../.cursor/rules/`](../.cursor/rules/) — the 15 cursor rules.
- [`../.cursor/skills/`](../.cursor/skills/) — cursor skills (add-rest-endpoint).
