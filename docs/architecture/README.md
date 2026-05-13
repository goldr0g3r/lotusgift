# Architecture

Index of architecture artefacts for LotusGift v2.

## Canonical dep-graph

The single dependency-graph diagram captures the deployed topology: four Next.js apps on Vercel, the NestJS modular monolith on Oracle Cloud Mumbai, the 16 service libraries, and every external dependency (data, payments, shipping, tax, messaging, observability).

- Source (always edit this): [`dep-graph.mmd`](dep-graph.mmd)
- Rendered SVG (committed; regenerate with `pnpm dlx @mermaid-js/mermaid-cli@latest -i docs/architecture/dep-graph.mmd -o docs/architecture/dep-graph.svg -t neutral -b transparent`): [`dep-graph.svg`](dep-graph.svg)

![LotusGift v2 dependency graph](dep-graph.svg)

## Decision records

Every architecturally-significant decision is documented in [`docs/adr/`](../adr/) using the [MADR 4.0](https://adr.github.io/madr/) format. See [`docs/adr/README.md`](../adr/README.md) for the index and authoring guide.

Current ADRs:

| ADR | Title | Status |
|-----|-------|--------|
| [0001](../adr/0001-india-launch-razorpay-and-carrier-aggregator.md) | India launch, Razorpay, carrier aggregator | accepted |
| [0002](../adr/0002-rest-over-trpc-with-nestjs-zod-and-kubb.md) | REST over tRPC, with nestjs-zod and Kubb | accepted |
| [0003](../adr/0003-vendor-tiered-monetization-no-customer-prime.md) | Vendor tiered monetization, no Customer Prime | accepted |
| [0004](../adr/0004-modular-monolith-first.md) | Modular-monolith-first | accepted |
| [0005](../adr/0005-hosting-oracle-mumbai-plus-vercel.md) | Hosting: Oracle Mumbai plus Vercel | accepted |
| [0006](../adr/0006-atlas-search-m0-budget-3-indexes.md) | MongoDB Atlas Search M0 budget — 3 indexes | accepted |
| [0007](../adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) | Corporate-gifting deltas — RFQ, customization, recipient list | accepted |

## Parent architecture plan

The 22-phase rebuild roadmap lives at [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md). Each phase has (or will get) its own sub-plan + research note under `.cursor/plans/` and `docs/research/`.

## Research notes

Retrieval-dated citations backing the ADRs and sub-plans:

- [`phase-0-scaffold.md`](../research/phase-0-scaffold.md) — PR-1 archive + workspace re-scaffold (CLI-only).
- [`phase-0-rules.md`](../research/phase-0-rules.md) — PR-2 Cursor rules + Copilot mirrors + subagents + skills.
- [`phase-0-docs.md`](../research/phase-0-docs.md) — PR-3 this PR (ADRs + dep-graph + README rewrite).

## Future architecture artefacts

Slots that will land in later PRs:

- `dep-cruiser-config.json` — automated import-direction enforcement (PR-4 CI).
- `infrastructure/oracle/` — Oracle deploy topology, nginx config, systemd units, heartbeat-cron (PR-7).
- `infrastructure/docker/docker-compose.yml` — local dev stack (PR-5).
- `infrastructure/atlas/search-indexes/*.json` — versioned Atlas Search index definitions (P6/P7/P9).
- `docs/architecture/sequences/` — flow-specific sequence diagrams (e.g., quote-to-PO, recipient-list-to-shipments, customization-approval) added as flows are designed.
