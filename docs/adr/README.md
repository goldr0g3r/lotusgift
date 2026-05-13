# Architecture Decision Records

This folder holds the LotusGift v2 architecture decision records (ADRs) using the [MADR 4.0](https://adr.github.io/madr/) format.

Each ADR captures a single architecturally-significant decision: the context, the options considered, the chosen option, and the consequences. ADRs are append-only — when an earlier decision is overturned, a new ADR is added that supersedes the old one (the old ADR's `Status` is updated to `superseded by ADR-NNNN` but the file itself stays in place).

## Status legend

- **proposed** — under discussion; not yet acted on
- **accepted** — the decision is the law of the codebase
- **rejected** — formally considered and not chosen (rare; usually we just don't write it down)
- **deprecated** — used to be `accepted`; the decision no longer reflects how the system works, but no replacement exists yet
- **superseded by ADR-NNNN** — replaced by a newer ADR; readers should jump to the replacement

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [0001](0001-india-launch-razorpay-and-carrier-aggregator.md) | India launch, Razorpay, carrier aggregator | accepted | 2026-05-12 |
| [0002](0002-rest-over-trpc-with-nestjs-zod-and-kubb.md) | REST over tRPC, with nestjs-zod and Kubb | accepted | 2026-05-12 |
| [0003](0003-vendor-tiered-monetization-no-customer-prime.md) | Vendor tiered monetization, no Customer Prime | accepted | 2026-05-12 |
| [0004](0004-modular-monolith-first.md) | Modular-monolith-first | accepted | 2026-05-12 |
| [0005](0005-hosting-oracle-mumbai-plus-vercel.md) | Hosting: Oracle Mumbai plus Vercel | accepted | 2026-05-12 |
| [0006](0006-atlas-search-m0-budget-3-indexes.md) | MongoDB Atlas Search M0 budget — 3 indexes | accepted | 2026-05-12 |
| [0007](0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) | Corporate-gifting deltas — RFQ, customization, recipient list | accepted | 2026-05-12 |

## Authoring a new ADR

1. Copy [`template.md`](template.md) to `NNNN-title-with-dashes.md` (next consecutive number, lowercase, dashes in the slug).
2. Fill in every section. Use the present tense for `Decision Outcome`. Use the future tense for `Consequences`.
3. Cite the relevant rows of the relevant `docs/research/phase-N-*.md` research note. Every external claim needs a retrieval-dated source.
4. Open a PR. Tag at least one decision-maker as a required reviewer.
5. Once merged, update this `README.md`'s Index table and (if applicable) the `Status` of any superseded ADR.

## See also

- [Parent architecture plan](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) — full rebuild scope, phased PR roadmap.
- [Dependency graph](../architecture/dep-graph.mmd) — single canonical diagram of system topology.
- [Research notes](../research/) — retrieval-dated citations that back the ADRs.
