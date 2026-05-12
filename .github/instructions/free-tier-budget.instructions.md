---
applyTo: "**"
---

# Free-Tier Budget

LotusGift v2 ships on free tiers until revenue justifies an upgrade. Every cloud-service choice cites the **current** free quota with a retrieval-dated docs URL. A weekly cron (`scripts/free-tier-quota-burn.ts`) tracks burn-rate and opens an "upgrade-path" research-note issue when any quota exceeds 70%.

## Do

- Cite the live free-tier docs page (with retrieval date) in the research note that introduces the service.
- Stay within: Atlas M0 (1 cluster · 3 search indexes · 3KB index def · <2M docs · <10GB), Oracle A1.Flex 4 OCPU+24GB ARM, Upstash Redis (10k cmds/day), Vercel Hobby, PostHog Cloud (1M events/mo), Cloudflare R2 (free egress).
- Run the burn cron weekly (`.github/workflows/free-tier-burn.yml`) and act on its output.

## Don't

- Add a new SaaS without a free-tier line item in the relevant research note.
- Provision >1 Atlas cluster or >3 Atlas Search indexes — split via `cleanup-atlas-search-mapping-drift.yml`.
- Ignore a 70%-threshold alert.

## Concrete example

```md
## Free-tier line items
- MongoDB Atlas M0 — 1 cluster, 3 Atlas Search indexes (allocated to products,
  vendors, orders), retrieved 2026-05-12 from https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/
- Oracle A1.Flex — 4 OCPU + 24 GB RAM, retrieved 2026-05-12.
```

## References

[docs/research/phase-0-rules.md](../../docs/research/phase-0-rules.md) — citations #7 (Oracle), #8 (Atlas M0 limits), #9 (Atlas Search M0). Burn-rate cron runs from `.github/workflows/free-tier-burn.yml`.
