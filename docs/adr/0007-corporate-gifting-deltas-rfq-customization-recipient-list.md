# Corporate-gifting deltas — RFQ, customization, recipient list

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan §4 (key deltas from nursery plan), corporate-gifting-domain rule authors
- **Informed:** every service and frontend author touching `rfq-service`, `customization-service`, `recipient-list-service`, `order-service`, `auth-service`, `product-service`, `promotions-service`, `tax-service`, `web-customer`, `web-vendor`, `web-admin`

## Context and Problem Statement

The nursery-plan template is a multi-vendor multi-warehouse marketplace optimised for plant nurseries (single-recipient consumer orders, pincode-fenced retail PLP, no customization workflow, no quote-and-PO motion). LotusGift v2 reuses ~80 % of that architecture but is a **corporate-gifting marketplace** with three domain-specific motions the nursery plan doesn't model:

1. **Auto-routing between instant cart and RFQ.** Small one-off orders go through cart-and-checkout; large bulk orders or customization-required orders are routed to a quote workflow with vendor negotiation.
2. **Deep customization workflow.** Buyers upload art files (logos, signatures, custom messages), vendors produce mockups, buyers approve, then vendors enter production. This is an audited, threaded, multi-party workflow distinct from a normal order.
3. **Recipient-list drop-shipping.** A single corporate buyer uploads a CSV of N recipients and gets one Order containing N Shipments — typical for "send this gift to all 350 employees".

This ADR codifies those three deltas plus four related changes (multi-recipient order model, corporate-buyer-org auth, no Customer Prime, scope clarifications) so the modular monolith ([ADR-004](0004-modular-monolith-first.md)) ships with the right shape from PR-5 onward.

## Decision Drivers

- Corporate gifting is **B2B with bulk + customization + recipient-list flows**; consumer-marketplace patterns cannot serve these motions.
- The previous codebase ([`_old/apps/api/src/quotes`](../../_old/apps/api/src/quotes)) already proves the quote workflow but lacks an auto-router and the customization state machine.
- Auto-routing must be **policy-configurable per vendor** (each vendor's MOQ and customization threshold differs) with **platform defaults** so a Starter-tier vendor doesn't have to think about it on day 1.
- Recipient-list CSV uploads must be **Zod-validated row-by-row** to catch bad pincodes / missing GSTINs before the buyer hits checkout.
- Customization art files contain IP-sensitive customer logos — must be **versioned, audited, R2-private-bucket**, not commingled with public product images.

## Considered Options

- **Three new services (`rfq-service`, `customization-service`, `recipient-list-service`) + 4 modifications (`order-service` multi-recipient, `auth-service` `corporate-buyer-org`, `promotions-service` drop Prime, `product-service` corporate-gifting taxonomy).** [chosen]
- Single "gifting-workflow-service" combining all three new flows.
- Bolt-on flags into existing services (e.g., add an `isQuote: boolean` flag on `order-service` instead of a separate `rfq-service`).
- Defer customization + recipient-list to post-launch; ship MVP with just RFQ.

## Decision Outcome

Chosen option: **"Three new services + 4 modifications"**, because each new motion has a distinct domain model, state machine, and event surface that warrants its own service library; bolting them into existing services would create entangled DTOs and event bundling violations of the `architecture-layers.mdc` rule.

### 1. `rfq-service` (NEW)

- **Quote state machine:** `DRAFT → SENT → NEGOTIATING → ACCEPTED → REJECTED → EXPIRED`.
- **Auto-router policy:** `RouteDecisionPolicy(orderDraft) → 'cart' | 'rfq'` based on **per-vendor configurable thresholds**:
  - `cart_value_max` (default ₹50 000) — above this, route to RFQ.
  - `per_product_moq` (vendor-set on each product) — exceeded → RFQ.
  - `requires_customization` flag (from `customization-service`) — true → RFQ.
- **Quote-to-PO conversion:** an `ACCEPTED` quote spawns an Order via `order-service` (events: `quote.accepted → order.draft.created`).
- **Negotiated pricing per line item** + **attachments** (R2-stored proposal PDFs) + **quote validity period** (auto-`EXPIRED` via a `QuotesScheduler` cron — pattern to be authored in P9b; quote-state baseline is in `_old/apps/api/src/quotes/quotes.service.ts`).
- **Replaces and extends** `_old/apps/api/src/quotes`.

### 2. `customization-service` (NEW)

- **Versioned art file upload to R2** in a private bucket `art:<orgId>/<lineItemId>/v<n>.{ai|pdf|png}`. File-type whitelist enforced. Virus-scan integration parked (`ClamAV` sidecar in `scaling-up.md`).
- **State machine:** `DRAFT → ART_UPLOADED → MOCKUP_PENDING → MOCKUP_DELIVERED → APPROVED | REJECTED → IN_PRODUCTION`. Audit log on every transition.
- **In-app message thread** scoped to a `CustomizationRequest` (buyer ↔ vendor; admin can view but not send by default).
- Outbox emits `customization.mockup.delivered`, `customization.approved`, `customization.rejected` events for `notification-service` to fan out via email + WhatsApp.

### 3. `recipient-list-service` (NEW)

- **CSV/Excel upload** with Zod-validated parsing.
- **Fixed-schema recipient row** for MVP (no vendor-custom columns):
  - `name`, `address-line-1`, `address-line-2` (optional), `city`, `state`, `pincode`, `phone`, `custom-message` (optional), `variant-sku` (optional), `billing-gstin` (optional).
- **One upload → one Order with N Shipments** via `order-service`'s saga orchestrator.
- Per-recipient personalization payload preserved on each shipment.

### 4. `order-service` (MODIFIED) — multi-recipient model

- An `Order` aggregates **N `Shipment`s**, each with `(warehouseId, vendorId, recipientAddress, personalization, customizationRequestId?)`.
- Saga orchestrator fans out **per-shipment inventory reservation + shipping-rate quote + tax-compute**; payment authorised once for the **order total**.
- Per-shipment compensation on partial failure.
- Auto-routing call into `rfq-service.routeDraft()` at "Checkout" click — if it returns RFQ, the cart converts to a draft quote and the buyer is redirected to the RFQ thread.

### 5. `auth-service` (MODIFIED) — corporate-buyer-org

- Three Better-Auth `organization` plugin org types:
  - `vendor-org` (with self-serve onboarding + admin approval gate).
  - **`corporate-buyer-org` (NEW)** — KYC (GSTIN + PAN), PO terms (Net-15 / Net-30), credit limit, multi-stakeholder approval matrix.
  - `internal-staff-org` (admin + customer-service users).
- **Individual retail buyers** still allowed without an org.
- Cross-subdomain SSO via single cookie domain (`.lotusgift.com`) — tested at P5 research note.

### 6. `promotions-service` (MODIFIED) — drop Customer Prime

- See [ADR-003](0003-vendor-tiered-monetization-no-customer-prime.md). Customer Prime explicitly out of scope.

### 7. `product-service` (MODIFIED) — corporate-gifting taxonomy

- Field set: `occasion[]` (Diwali / Christmas / employee-anniversary / new-joiner / client-gifting / general), `recipientType[]` (employees / clients / partners), `customizable: boolean`, `brandingAreas[]` (front / back / sleeve / box / engraving / embroidery), `moq: number`, `leadTimeDays: number`, `sampleAvailable: boolean`, `hsnCode: string`.
- Replaces plant taxonomy (compostable-pot filters, hardiness-zone search) from the nursery plan.

### 8. Scope clarifications (codified here so no separate ADR is needed)

- **No anonymous / guest checkout.** Every paid order requires an authenticated user (`web-customer` retail accounts allowed; corporate-buyer-org required for credit-terms path).
- **No PWA offline cart.** Corporate buyers use desktop, not mobile/offline; offline-cart parked indefinitely.
- **No plant taxonomy.** Field names and search facets explicitly corporate-gifting-coded; the `product-service` schema does not retain any plant-domain fields from the nursery plan.

### Consequences

- Good, because each motion (RFQ, customization, recipient-list) is independently shippable and testable.
- Good, because the auto-router lives in `rfq-service` and is called by `order-service` at checkout — clean separation, configurable per vendor, default policy in `web-admin`.
- Good, because the customization audit log + threaded messages create a paper trail that B2B buyers expect for IP-sensitive art.
- Good, because the recipient-list service makes the most common corporate-gifting use case (send to N employees) a first-class flow rather than a power-user workaround.
- Good, because corporate-buyer-org auth surfaces KYC + credit limit + multi-stakeholder approval, all of which corporate buyers expect from a B2B platform.
- Bad, because three new services add ~3× CI surface, ~3× test surface, ~3× research notes. Mitigation: research-note-per-module rule + corporate-gifting-domain-auditor subagent already shipped in PR-2.
- Bad, because the customization R2 bucket is **IP-sensitive** — bucket policy + signed-URL TTL + access-log retention must be explicitly designed. Tracked as a P8b research-note acceptance criterion.
- Neutral, because vendor + buyer apps gain customization-thread + RFQ-inbox + recipient-list-uploader UI components; these are itemised in P16/P17 design discovery.

### Confirmation

- `rfq-service.spec.ts` integration tests assert: auto-router returns `cart` for ₹10 k single-product orders; `rfq` for ₹100 k orders; `rfq` for any cart containing a `customizable: true` product; vendor-specific override of `cart_value_max` works.
- `customization-service.spec.ts` integration tests assert: state-machine transitions block illegal moves (e.g., `DRAFT → IN_PRODUCTION` is rejected); audit log captures every transition; outbox event fires on `MOCKUP_DELIVERED → APPROVED`.
- `recipient-list-service.spec.ts` integration tests assert: malformed CSV row is rejected with field-level error array; valid 50-row CSV creates 50 shipments in one Order; missing optional fields are accepted; presence of `billing-gstin` triggers per-shipment B2B e-invoice generation in `tax-service`.
- `auth-service.spec.ts` extends Better-Auth's organization plugin tests for the `corporate-buyer-org` org type (KYC fields persist, credit-limit enforcement blocks order placement past limit, approval matrix routes orders to the right approver).
- `product-service.spec.ts` extends to assert all new taxonomy fields validate via Zod, are indexed in Atlas Search ([ADR-006](0006-atlas-search-m0-budget-3-indexes.md)), and reject invalid `occasion` / `recipientType` enum values.
- The `corporate-gifting-domain.mdc` rule (already shipped in PR-2) is enforced by the `corporate-gifting-domain-auditor` subagent in CI.

## Pros and Cons of the Options

### Three new services + 4 modifications [chosen]

- Good, because each motion has its own domain model + state machine + audit trail.
- Good, because services can be tested + reasoned about independently; eventual split-out is cheap.
- Bad, because more services = more boot-time wiring in `apps/api-gateway`.
- Bad, because event-naming discipline matters more (parent plan section 4 events: `rfq.opened`, `customization.mockup.approved`, `recipient-list.uploaded`, `order.routed-to-rfq`).

### Single "gifting-workflow-service"

- Good, because fewer services to wire.
- Bad, because the three motions have **distinct lifecycles** — combining them creates a service with three independent state machines + three audit logs + three event sets. Not cohesive.
- Bad, because the `microservice-boundaries.mdc` rule explicitly prefers cohesive-bounded-context services over coarse-grained workflow services.

### Bolt-on flags into existing services

- Good, because zero new services.
- Bad, because `isQuote: boolean` on `order-service` means quote-state-machine logic leaks into the order aggregate — proven failure mode from `_old`.
- Bad, because `recipient-list-csv: string` on `order-service` means CSV parsing + Zod validation + recipient personalisation lives in a service whose primary concern is order state. Anti-cohesion.

### Defer customization + recipient-list to post-launch; ship just RFQ

- Good, because tightest possible MVP scope.
- Bad, because **customization is the differentiator** for the corporate-gifting buyer; without it, LotusGift is "just another B2B marketplace with bulk discounts".
- Bad, because recipient-list is the most common buyer workflow ("send to 350 employees"); deferring it makes the product feel power-user-only.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), section 1 (TL;DR three corporate-gifting extensions), section 4 (key deltas), sections 7-10 (per-service phase plan for P5-P15 covering all 7 services touched here).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citations #15 (Better-Auth Organization plugin), #16 (GST e-invoicing background — corporate-buyer-org GSTIN unlocks per-shipment IRP e-invoice).
- Existing rule: [`.cursor/rules/corporate-gifting-domain.mdc`](../../.cursor/rules/corporate-gifting-domain.mdc) — codifies auto-router policy + recipient-list validation + customization workflow invariants as a lint-time rule.
- Existing subagent: [`.cursor/agents/corporate-gifting-domain-auditor.md`](../../.cursor/agents/corporate-gifting-domain-auditor.md) — audits PRs touching the three services + four modifications.
- Reusable `_old` artefacts:
  - [`_old/apps/api/src/quotes/quotes.service.ts`](../../_old/apps/api/src/quotes/quotes.service.ts) — quote workflow baseline that `rfq-service` extends.
  - [`_old/apps/api/src/quotes/dto/`](../../_old/apps/api/src/quotes/dto/) — DTO shapes (to be ported to Zod under [ADR-002](0002-rest-over-trpc-with-nestjs-zod-and-kubb.md)).
- Related ADRs:
  - [ADR-001](0001-india-launch-razorpay-and-carrier-aggregator.md) — Razorpay path includes PO + credit terms for `corporate-buyer-org`.
  - [ADR-003](0003-vendor-tiered-monetization-no-customer-prime.md) — no Customer Prime is part of this delta set.
  - [ADR-006](0006-atlas-search-m0-budget-3-indexes.md) — `vendors` Atlas Search index facets on `corporate-gifting-domain.mdc`-aligned capabilities.
