# Phase-0 Research Note — Architecture Docs + ADRs (PR-3)

**Phase:** 0 (foundation)
**Topic:** ADRs 001–007, architecture dep-graph, README rewrite
**Owner:** @goldr0g3r
**Status:** Implementation in progress
**Sub-plan:** [.cursor/plans/p0-docs_sub-plan_pr-3_c335f2fd.plan.md](../../.cursor/plans/p0-docs_sub-plan_pr-3_c335f2fd.plan.md)
**Parent plan:** [.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md)

## 1. Goal

Lock down the seven load-bearing architectural decisions from the parent plan as MADR-format ADRs, ship a canonical dependency-graph diagram (Mermaid source + rendered SVG), and rewrite the root README so future contributors can navigate the workspace without reading the 350-line parent plan. No code changes; this PR is documentation only.

## 2. Retrieval-dated citations (verified 2026-05-12 unless noted)

| # | Topic | Title / Page | URL | Retrieved | Notes |
|---|-------|--------------|-----|-----------|-------|
| 1 | Razorpay payment gateway | About Payment Gateway | https://razorpay.com/docs/payments/payment-gateway/ | 2026-05-12 | Cards (domestic + international), netbanking, UPI, COD, EMI, Cardless EMI, wallets (Paytm, PhonePe). 800 TPS load. Multi-route success-rate optimisation. Settlement reconciliation. WooCommerce / WordPress / Magento / Shopify plugins. |
| 2 | Razorpay payment methods | About Payment Methods | https://razorpay.com/docs/payments/payment-methods/ | 2026-05-12 | Card + ACH Direct Debit on Checkout; expanding to Apple Pay + PayPal. UPI / netbanking / COD continue as standard. Error code catalogue per method. |
| 3 | Shiprocket | All-in-One eCommerce Growth Partner | https://www.shiprocket.in/ | 2026-05-12 | Domestic: 19,000+ pin codes nationwide, ₹20 / 500 g starting rate, 42+ courier partners aggregated, 5 lakh+ daily transactions, multi-warehouse fulfilment (35 last-mile-enabled warehouses). Cross-border: 220+ countries. SDKs for Node / PHP / React / Laravel / Angular. |
| 4 | Blue Dart Express | Homepage + corporate news | https://www.bluedart.com/ | 2026-05-12 | India's most-awarded express logistics company. Premium nationwide pin code reach. ₹5,720 Cr FY25 revenue. Self-onboarding portal. 2FA for partner portal. General Price Increase effective Jan 1 2026 (annual). |
| 5 | Delhivery | Services overview | https://www.delhivery.com/services | 2026-05-12 | Page is JS-only at fetch time; landing confirms Express Parcel + Freight + Courier + Supply Chain + eCommerce + Cross-Border product lines. Public docs at https://www.delhivery.com/api (re-verify at P11). |
| 6 | MongoDB Atlas Search M0 limits | MongoDB Search Compatibility & Limitations | https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/ | 2026-05-12 | Free clusters: **3 indexes max** (any combination of `search` / `vector`). Definition JSON cap 3 KB. One synonym mapping per index. Index builds with >300 fields fail. Synonyms collection capped at 10 k docs. Indexes are rebuilt on scale-up (initial sync). |
| 7 | MongoDB Atlas Search facets / sort | Same page, MongoDB version table | https://www.mongodb.com/docs/atlas/atlas-search/about/feature-compatibility/ | 2026-05-12 | Facets / sort / `$lookup` / `$unionWith` with `$search` all require Mongo 7.0+ or 8.0+. M0 cluster needs to be on a compatible version (default new clusters as of 2026 already are). |
| 8 | Oracle Cloud Always Free | Always Free Resources | https://docs.cloud.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm | 2026-05-12 (page updated 2025-08-05) | A1.Flex up to **4 OCPU + 24 GB RAM ARM** in home region (3000 OCPU-hr + 18 000 GB-hr per month). 200 GB Block Volume. 20 GB Object Storage. 1 Flexible Load Balancer 10 Mbps. 10 TB / month outbound data. **Idle reclaim: 95th-percentile CPU + network + memory < 20 % over 7 days** triggers reclaim. |
| 9 | Vercel Hobby plan | Vercel Hobby Plan | https://vercel.com/docs/plans/hobby | 2026-05-12 | Hobby (free): 200 projects, 100 deploys/day, 4 CPU-hr active CPU, 360 GB-hr memory, 1 M function invocations, 100 GB-hr function duration, 6 000 build-minutes, 4 build vCPU, 8 GB build memory, 1 M edge requests, 1 M ISR reads. **Hobby restricts to non-commercial personal use** (fair-use). Pro upgrade unlocks team collaboration, commercial use, custom domains beyond 50/project. |
| 10 | Vercel Pro plan (table on same page) | Vercel Hobby Plan | https://vercel.com/docs/plans/hobby | 2026-05-12 | Pro: 16 CPU-hr active CPU, 1 440 GB-hr memory, 10 M function invocations, unlimited projects, 6 000 deploys/day, function duration up to 300 s. $20 / user / month. Commercial-use compliant. |
| 11 | MADR format | About MADR | https://adr.github.io/madr/ | 2026-05-12 | MADR 4.0-beta released 2024-09-02. Template fields: status, date, decision-makers, consulted, informed (optional YAML frontmatter) + Context and Problem Statement / Decision Drivers (optional) / Considered Options / Decision Outcome / Consequences / Confirmation (optional) / Pros and Cons of the Options (optional) / More Information (optional). Filenames: `NNNN-title-with-dashes.md`. Dual-licensed MIT or CC0. |
| 12 | @mermaid-js/mermaid-cli | Command-line interface for mermaid | https://www.npmjs.com/package/@mermaid-js/mermaid-cli | 2026-05-12 | v11.14.0 published 2026-04-29. Peer dep `puppeteer ^23 \|\| ^24` (downloads Chromium). `mmdc -i input.mmd -o output.svg -t neutral -b transparent`. Node LTS 20+. Runs offline once Chromium is fetched. |
| 13 | nestjs-zod | nestjs-zod npm | https://www.npmjs.com/package/nestjs-zod | 2026-05-12 | v5.3.0 (Apr 5 2026). Requires Zod `^3.25.0 \|\| ^4.0.0`. APP_PIPE `ZodValidationPipe`, APP_INTERCEPTOR `ZodSerializerInterceptor`, `cleanupOpenApiDoc(doc)` replaces deprecated `patchNestJsSwagger`. Generates OpenAPI schemas from Zod automatically. |
| 14 | Kubb v3 | Kubb — OpenAPI to TypeScript | https://kubb.dev/ | 2026-05-12 | v3 (Sep 2024+), `unplugin-kubb@5.0.14` (2026-04-07). TanStack Query v5 only. `@kubb/plugin-react-query` for React. MCP support for Cursor. `npx kubb init` + `npx kubb generate`. |
| 15 | Better-Auth | Better Auth homepage | https://www.better-auth.com/ | 2026-05-12 | TypeScript auth framework, 845+ contributors, used by OpenAI / Databricks / Strapi. Plugin set covers email / password / passkey / 2FA / OTP / magic-link / username / one-tap / phone / anonymous / bearer / OAuth / SIWE / Organization (with teams + roles) / Admin / API key / SSO / SCIM / JWT / HIBP / captcha / Stripe / Polar / Open API / MCP. Backed by `dash.better-auth.com` for managed audit-log / Sentinel threat-detection. |
| 16 | GST e-invoicing (general) | E-Invoicing under GST | https://taxguru.in/goods-and-service-tax/e-invoicing-gst.html | 2026-05-12 | Background article. E-invoices generated through the Invoice Registration Portal (IRP) at the time of issue; each invoice carries a unique IRN. Applies to businesses above a turnover threshold set by the GST council (re-verify the current threshold in P13 research note via official GSTN sources). |
| 17 | GitHub Projects v2 (own board) | LotusGift v2 Roadmap | https://github.com/users/goldr0g3r/projects/9 | 2026-05-12 | User-level Projects v2 board with custom fields (Phase / Workstream / Layer / Type). PR-3 board item to be added to track this PR. |

## 3. Decisions log

| # | Decision | Chose | Rejected | Reasoning |
|---|----------|-------|----------|-----------|
| D1 | ADR format | MADR 4.0 | adr-tools (Markdown ADR Toolkit), Nygard's original ADR template, custom format | MADR 4.0 has the most modern template (`status: accepted`, decision-makers / consulted / informed lists), is markdownlint-clean by default, and the example template ships with the upstream repo. Source: citation #11. |
| D2 | ADR location | `docs/adr/` | `docs/decisions/` (MADR default), `docs/architecture/decisions/` | `docs/adr/` is the shortest discoverable path and matches the [parent plan section 8 wording](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md#8-first-wave-deliverables-phase-0-8-prs--reordered-archivescaffold-first) ("ADR-001..ADR-007"). |
| D3 | ADR filename | `NNNN-title-with-dashes.md` | `NNNN-Title-CamelCase.md`, no number prefix | Matches MADR upstream convention (citation #11) — keeps ordering visible in `ls` and allows `adr-tools`-style automation later if desired. |
| D4 | Dep-graph format | Mermaid source + rendered SVG | Hand-drawn SVG, PlantUML, dependency-cruiser export | Mermaid renders inline on GitHub even without the SVG; SVG is the static fallback. dependency-cruiser comes with PR-4 CI but the codebase is mostly empty scaffolds at PR-3, so a hand-authored graph is the only honest option. |
| D5 | Dep-graph location | `docs/architecture/dep-graph.{mmd,svg}` | `docs/architecture.md` (single file with embedded mermaid), `docs/dep-graph.svg` (no subfolder) | Subfolder leaves room for future architecture artefacts (sequence diagrams, deployment topology, ER diagrams) without polluting `docs/` root. |
| D6 | MADR `status` value at land time | `accepted` | `proposed`, `accepted-pending-review` | All seven ADRs codify decisions already made and documented in the parent plan; landing them as `accepted` is honest. Any reversal goes through a superseding ADR per MADR convention. |
| D7 | ADR `date` field | Today's date (2026-05-12) | Date the decision was first made (varies per decision) | Reflects the date the ADR was *written*. The decision history (e.g., "tRPC was considered during nursery-plan drafting in week of 2026-05-05") lives in the Context section, not the `date` field. |
| D8 | Mermaid render theme | `-t neutral -b transparent` | `-t default`, `-t dark`, `-t forest` | Neutral theme renders identically in GitHub light + dark modes; transparent background lets the SVG inherit GitHub's page background. |
| D9 | Mermaid fallback if puppeteer fails on Windows agent | Commit `.mmd` only and rely on GitHub's built-in Mermaid preview for the README embed; revisit SVG generation in CI later | Generate PNG via screen-capture, skip the rendered asset entirely | GitHub renders fenced `mermaid` blocks natively in Markdown; the SVG is an optional convenience for non-GitHub viewers (PR descriptions, downstream docs sites). Acceptable to defer if local rendering fails. |
| D10 | README rewrite scope | Full rewrite — Vision, Repo map, Quickstart, Architecture at a glance, Decision log, Phase roadmap, Contributing, Free-tier posture | Patch the existing "PR-1 scaffold" README in place | The current README is scoped to PR-1 only ("Status: PR-1 scaffold (pre-launch, greenfield)"). PR-3 lifts it to a real project README. Keeps the verified workspace-layout table verbatim. |

## 4. Open questions

| # | Question | Provisional answer | Final answer |
|---|----------|-------------------|--------------|
| Q1 | ADR-001: do we explicitly call out COD support as MVP? | Yes — parent plan §4 payment-service entry lists it explicitly. | Resolved during ADR-001 drafting → captured under "Decision". |
| Q2 | ADR-005: pin Vercel project count to 4 from day 1? | Yes — needed to lock subdomain SSO testing at P5. | Resolved during ADR-005 drafting → captured. |
| Q3 | ADR-006: reserve any of the 3 Atlas Search index slots? | No — commit all 3 to `products` / `vendors` / `orders`; revisit at P15+. | Resolved during ADR-006 drafting → captured. |
| Q4 | ADR-007: explicitly call out anonymous/guest checkout dropped? | Yes — fold into ADR-007 as "Scope clarifications" section instead of a separate ADR. | Resolved during ADR-007 drafting → captured. |
| Q5 | GST e-invoice mandate threshold (₹5 cr AATO as of mid-2023, possibly lower by 2026) | Cite taxguru background article + flag in P13 research-note for definitive answer | Pending P13 |
| Q6 | Razorpay subscription product availability for B2B auto-replenish | Confirmed present (citation #1 references settlements + recurring) but exact pricing TBD at P14 | Pending P14 |

## 5. Implementation checklist

- [x] Research note committed (this file)
- [x] `docs/adr/template.md` (MADR 4.0)
- [x] `docs/adr/README.md` (index)
- [x] `docs/adr/0001-india-launch-razorpay-and-carrier-aggregator.md`
- [x] `docs/adr/0002-rest-over-trpc-with-nestjs-zod-and-kubb.md`
- [x] `docs/adr/0003-vendor-tiered-monetization-no-customer-prime.md`
- [x] `docs/adr/0004-modular-monolith-first.md`
- [x] `docs/adr/0005-hosting-oracle-mumbai-plus-vercel.md`
- [x] `docs/adr/0006-atlas-search-m0-budget-3-indexes.md`
- [x] `docs/adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md`
- [x] `docs/architecture/dep-graph.mmd`
- [x] `docs/architecture/dep-graph.svg` (rendered via `@mermaid-js/mermaid-cli@11.14.0` after `npx puppeteer browsers install chrome`)
- [x] `docs/architecture/README.md`
- [x] Root `README.md` rewrite
- [x] `pnpm install && pnpm build && pnpm lint` smoke clean (36 lint tasks ok, 1 pre-existing warning in `app.e2e-spec.ts` is not introduced by this PR)
- [x] `markdownlint-cli2` zero errors across all 16 changed / new docs (`.markdownlint.jsonc` codifies established repo style)
- [ ] PR opened + Copilot review requested
- [ ] Implementation reference (§6 below) filled in post-merge

## 6. Implementation reference

(Will be appended after PR merge per the parent plan §7b status-sync workflow.)

- PR URL: _pending_
- Merged at: _pending_
- Commits: _pending_
- CI run: _pending_
- Projects v2 board item: _pending_
- Parent plan todo: `p0-docs` flipped from `pending` → `completed`
