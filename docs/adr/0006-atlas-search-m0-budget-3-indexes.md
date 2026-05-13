# MongoDB Atlas Search on M0 — 3-index budget allocated to products, vendors, orders

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan §9 (data tier), nursery-plan search strategy
- **Informed:** `product-service`, `vendor-service`, `order-service` authors (P6, P7, P9)

## Context and Problem Statement

LotusGift v2 needs full-text + faceted search across at least three primary surfaces: the buyer-facing product catalog, the vendor directory (corporate buyers searching for specific vendor capabilities — "screen-printed t-shirts", "wooden engraved gifts"), and the admin / customer-service order lookup. MongoDB Atlas Search is the most operationally convenient option since the same cluster already stores all primary data ([ADR-005](0005-hosting-oracle-mumbai-plus-vercel.md) → Atlas M0 AWS Mumbai). However, the free-tier M0 cluster imposes a hard cap of **3 search indexes** ([citation #6](../research/phase-0-docs.md)). This ADR commits the entire budget to the three highest-leverage surfaces and bans new Atlas Search indexes until either the budget is freed (decom an existing index) or the cluster is upgraded.

## Decision Drivers

- M0 caps: **3 indexes max** (search or vector, combined), **3 KB definition JSON cap**, **1 synonym mapping per index**, **<300 indexed fields**, **<2 M docs / <10 GB indexable**.
- The cluster scale-up (M0 → M10) triggers an initial-sync index rebuild that's not free in time even when it's free in money.
- Full-text search on `products` is **non-negotiable** at MVP (buyers expect Amazon-grade catalog search).
- Vendor directory search needs facets + autocomplete (corporate buyers slicing by capability + state + tier).
- Order lookup search powers `web-admin` + `web-customer-service`'s order-360 view; without it, the support flow degrades to status-equal filters.
- Other potential candidates (customization-thread, RFQ, recipient-list) can be served by **standard Mongo regex / `$text` queries + indexed compound queries** at MVP scale (<10 k docs each).

## Considered Options

- **Atlas Search indexes on `products`, `vendors`, `orders` (3 / 3 budget used); all other search via standard Mongo queries.** [chosen]
- Atlas Search on `products` only; rely on UI filters + standard Mongo for `vendors` and `orders`.
- Self-host Typesense / Meilisearch on the Oracle VM.
- Elastic free tier (Elastic Cloud trial) — not free past 14 days.
- No full-text search at MVP; UI search via prefix-match + `$regex`.

## Decision Outcome

Chosen option: **"Atlas Search on `products`, `vendors`, `orders`"**, because these three are the only collections where users will type free-form queries against fields with corporate-gifting-specific tokenisation (synonyms, autocomplete prefixes, fuzzy matching) at scale that exceeds Mongo's standard text index.

Concrete budget:

- **Slot 1: `products` (corporate-gifting catalog search).** Fields indexed: `name`, `description`, `occasion[]`, `recipientType[]`, `brandingAreas[]`, `categoryId` (facet), `vendorId` (facet), `hsnCode` (filter). Synonym set: `corporate gift -> business gift, employee gift, client gift -> partner gift`. Autocomplete on `name` with edge n-gram tokenizer. Fuzzy match with prefix length 2.
- **Slot 2: `vendors` (vendor directory search).** Fields indexed: `legalName`, `displayName`, `capabilities[]` (e.g., "screen-printing", "engraving", "embroidery", "laser-cut"), `serviceStates[]` (facet — Maharashtra, Karnataka, etc.), `tier` (facet — Starter / Growth / Scale, per [ADR-003](0003-vendor-tiered-monetization-no-customer-prime.md)). Synonym set for capabilities (e.g., "printing -> print, embellish, decorate").
- **Slot 3: `orders` (admin + customer-service lookup).** Fields indexed: `orderNumber` (analyzer: keyword for exact match), `buyer.name`, `buyer.gstin`, `shipments[].recipientName`, `shipments[].recipientAddress.pincode`, `status` (facet), `createdAt` (date facet bucketed by month).
- **All other search surfaces** (RFQ inbox, customization threads, recipient lists, notification inbox) use:
  - Compound Mongo indexes on the filter columns.
  - Mongo `$text` index where simple full-text suffices.
  - In-memory filter on already-paginated results where the collection size is small (< 1 000 docs per typical query).

### Upgrade triggers (parked for `scaling-up.md` runbook, PR-8)

Migration M0 → M10 fires when **any one** of:

- Total indexed-doc count across the three slots approaches **2 M** (citation #6 indexable-document soft cap).
- Cluster storage approaches **10 GB** (M0 hard cap).
- A fourth Atlas Search index becomes business-critical (e.g., post-launch we want autocomplete on `customizationRequests` for the vendor inbox).
- A second synonym mapping per index becomes required.

M0 → M10 costs $57 / month at AWS Mumbai (2026 pricing — verify in scaling-up runbook), so this is **not** a free-tier move; gates on revenue.

### Consequences

- Good, because the three indexes cover the three highest-leverage search surfaces in a B2B corporate-gifting marketplace.
- Good, because standard Mongo queries for the other surfaces are cheap and well-understood.
- Good, because the 3-index budget enforces discipline — every new search surface must justify retiring an existing one.
- Bad, because **no Atlas Search on `customizationRequests` or `quotes`** at MVP — vendor inbox search is `$regex`-based, slower for >10 k documents.
- Bad, because **the synonym dictionary lives in the index definition** (M0 caps at 1 mapping per index) → no dynamic synonym CRUD per vendor.
- Bad, because **scale-up triggers an initial sync rebuild** (citation #6) — when M0 → M10 fires, plan ~30-60 minutes of degraded search during sync.
- Neutral, because vector search (semantic / embeddings) is parked indefinitely; corporate-gifting search is keyword-dominated.

### Confirmation

- `infrastructure/atlas/search-indexes/products.json` (forthcoming P7), `infrastructure/atlas/search-indexes/vendors.json` (P6), `infrastructure/atlas/search-indexes/orders.json` (P9) are versioned in git; `.github/workflows/atlas-search-mapping-drift.yml` (PR-4) detects drift between the committed JSONs and the live cluster.
- `product-service` integration test: `$search` with facet on `vendorId` returns the seeded product corpus correctly bucketed; autocomplete on partial `name` ("diw" → "Diwali hampers") works with prefix length 2.
- `vendor-service` integration test: `$search` with facet on `tier` + `serviceStates` returns vendor matches filtered correctly.
- `order-service` integration test: `$search` with `orderNumber` keyword analyzer returns exact match; `$text` fallback on `customizationRequests` confirms standard-Mongo path.
- A documentation comment in each service's `repository.ts` lists which fields are Atlas-Search-indexed vs. Mongo-indexed, so future authors don't accidentally widen the index definition past 3 KB.

## Pros and Cons of the Options

### Atlas Search on products + vendors + orders [chosen]

- Good, because the search experience matches buyer expectations on the three highest-leverage surfaces.
- Good, because zero new infra to operate (Atlas Search runs inside the cluster).
- Good, because facets / autocomplete / fuzzy come for free.
- Bad, because the 3-index cap is rigid → discipline cost.
- Bad, because rebuilding on scale-up is a planned downtime event.

### Atlas Search on products only

- Good, because saves 2 slots for future.
- Bad, because **vendor directory + order lookup degrade meaningfully** without full-text + facets; the gap is felt at MVP, not at scale.

### Self-host Typesense / Meilisearch on Oracle VM

- Good, because removes Atlas M0 budget constraint entirely; ~10 indexes available.
- Bad, because **eats into the 24 GB Oracle RAM budget** that the modular monolith already wants — and the entire backend already cohabits one VM.
- Bad, because operating Typesense / Meilisearch (backups, replica, index rebuild on schema change) is a non-trivial second data tier; team-of-one cost.
- Bad, because no managed integration with MongoDB — every index update is a manual sync job we'd have to write.

### Elastic free tier

- Good, because best-in-class search.
- Bad, because **Elastic Cloud is a 14-day trial, not a free tier** in 2026. Anything self-hosted (Elastic Container Service) is operationally enormous.

### No full-text search at MVP; `$regex`-only

- Good, because zero search-infra decisions.
- Bad, because `$regex` is **not indexable for non-prefix patterns** — every "find me wooden engraved gifts" query becomes a collection scan as `products` grows past ~5 k docs.
- Bad, because no facets, no autocomplete, no synonyms — instantly perceived as a worse-than-Amazon catalog UX, killing buyer confidence at the most important UX moment.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), section 9 (Atlas Search budget: 3 indexes total — allocated to products / vendors / orders).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citations #6 (Atlas Search M0 limits), #7 (Atlas Search MongoDB version compatibility).
- Forthcoming runbook: [`docs/runbooks/scaling-up.md`](../runbooks/scaling-up.md) (PR-8) — M0 → M10 migration trigger thresholds.
- Forthcoming CI workflow: [`.github/workflows/atlas-search-mapping-drift.yml`](../../.github/workflows/atlas-search-mapping-drift.yml) (PR-4 skeleton, P7 implementation).
- Related ADRs:
  - [ADR-005](0005-hosting-oracle-mumbai-plus-vercel.md) — companion compute-tier decision (Atlas M0 AWS Mumbai sits beside Oracle A1.Flex Mumbai).
  - [ADR-007](0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) — corporate-gifting taxonomy on `products` (occasion, recipientType, brandingAreas) is what the `products` search index needs to facet on.
