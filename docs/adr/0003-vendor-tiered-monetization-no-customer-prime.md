# Vendor-tiered monetization, no Customer Prime

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan authors (corporate-gifting deltas vs. nursery plan)
- **Informed:** `promotions-service`, `vendor-service`, `payment-service`, `web-vendor` UX authors

## Context and Problem Statement

The nursery-plan template ([`nursery-plan.md`](../../_old/nursery-plan.md) if present, otherwise referenced in [parent-plan §4](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md#4-key-deltas-from-the-nursery-plan)) included a Customer Prime consumer-subscription tier for retail buyers. LotusGift v2 is a B2B corporate-gifting marketplace where buyers are organisations (HR teams, founders, client-relations managers), not individual retail shoppers; a Prime-style consumer plan has no addressable audience here. This ADR formally drops Customer Prime from scope and codifies the four monetization streams the v2 marketplace will use instead.

## Decision Drivers

- LotusGift's customers are **corporate-buyer-orgs** (HR teams, founders, client-relations managers) and individual buyers placing one-off retail orders; neither cohort wants a recurring consumer subscription for "free shipping + early access".
- Vendor onboarding is the gating motion for marketplace growth; vendors will pay for **visibility + tooling + lower commissions**, which is the canonical Amazon-Marketplace / Etsy / Faire model.
- B2B corporate gifting has **legitimate recurring patterns** (monthly engagement gifts, quarterly client appreciation, annual Diwali hampers); subscription-style auto-replenish is valuable here, but it's a buyer-flow feature, not a paid plan.
- Volume discounts are the natural promotional lever for corporate gifting (1000-unit Diwali run vs. 50-unit Founder's Day run); these must be **vendor-defined at the product level**, not platform-imposed.

## Considered Options

- **Vendor tiers + sliding commission + vendor-defined volume discounts + buyer-side auto-replenish (B2B recurring).** [chosen]
- Consumer Prime subscription (nursery-plan default) + flat commission.
- Transaction-only revenue (commission per order, no vendor subscription, no Prime).
- Marketplace ad placements + commission (Amazon Sponsored Products style).

## Decision Outcome

Chosen option: **"Vendor tiers + sliding commission + vendor-defined volume discounts + buyer-side auto-replenish"**, because the B2B corporate-gifting audience monetises via vendor pull (vendors paying for visibility, lower commissions, and richer tooling) rather than consumer push (buyers paying for membership benefits).

Concrete scope:

- **Vendor subscription tiers** (parent plan §4 `promotions-service`):
  - **Starter** (free) — up to N products, base commission rate, standard support, basic per-warehouse SLA scorecard.
  - **Growth** (paid monthly) — higher product cap, reduced commission, priority support, ad-hoc featured-collection placements, AI insights from `insights-service` (P15).
  - **Scale** (paid monthly) — unlimited products, lowest commission, dedicated account manager, full insights suite, multi-warehouse SLA dashboards, priority RFQ routing.
- **Sliding commission schedule** — per-vendor commission rate is `base_rate - tier_discount - GMV_volume_discount`, with all three components configurable by an admin in `web-admin`.
- **Vendor-defined volume discounts at the product level** — vendor sets rules like "≥100 units → 5 % off, ≥500 units → 10 % off, ≥1000 units → 15 % off" on each product; auto-applied at cart / quote.
- **Buyer-side auto-replenish (B2B recurring)** — recurring orders for repeat corporate gifting (monthly engagement-gift cadence, quarterly client appreciation). Razorpay Subscriptions API powers the recurring charge. **Free to buyers; vendors pay normal commission on each cycle.**
- **No Customer Prime / no consumer membership tier** — explicit non-goal. Anonymous browsing is allowed; authenticated retail accounts are free; corporate-buyer-org accounts are free.
- **No marketplace ad placements at MVP** — parked for post-P22 (revisit in `scaling-up.md` runbook).

### Consequences

- Good, because vendor tiers create a clear upgrade path that scales with vendor success (low-friction Starter for trial vendors, Scale for the top-grossing 5 %).
- Good, because vendor-defined volume discounts encode corporate-gifting reality (large bulk orders) without the platform having to maintain a global discount registry.
- Good, because buyer-side auto-replenish opens MRR-style revenue patterns (recurring monthly engagement gifts) without forcing a Prime-style upsell.
- Good, because dropping Customer Prime drops a whole UI/UX surface area (subscription join-flow, manage subscription, cancel-flow, churn-prevention).
- Bad, because we lose a potential acquisition vector for individual retail buyers who might have signed up for Prime — assessed as low-impact (B2B is the focus).
- Bad, because tier-based product caps require accurate enforcement at product-create time and on tier downgrades (tier-downgrade saga must hide overflow products and notify the vendor). Tracked in P6 / P7 research notes.
- Neutral, because marketplace ad placements remain a credible future revenue stream; just not at MVP.

### Confirmation

- `promotions-service` integration tests assert: vendor tier change recomputes effective commission for all open quotes; product-cap enforcement blocks new products on tier downgrade; volume-discount rules apply in cart total computation; auto-replenish triggers create a new Order draft on schedule.
- `web-vendor` PLP shows tier-restricted features (e.g., ad-hoc featured slots) only on Growth+; UI smoke test asserts gating.
- `web-admin` settings page exposes the base commission rate, per-tier discount %, and per-vendor GMV-volume discount %; smoke test asserts admin can edit all three.
- `payment-service` Razorpay Subscriptions handler integration test asserts: charge cycle fires per the scheduled cadence; failure path notifies the buyer and creates a `subscription.payment_failed` outbox event.
- ADR-007 confirms the corporate-buyer-org model that surfaces the buyer-side auto-replenish flow.

## Pros and Cons of the Options

### Vendor tiers + sliding commission + volume discounts + buyer auto-replenish [chosen]

- Good, because matches the proven B2B-marketplace monetization pattern (Faire, Alibaba, Etsy Wholesale).
- Good, because layered revenue (subscription + commission + per-tier overrides) → revenue diversification.
- Good, because auto-replenish captures recurring corporate-gifting cadences that buyers actually want.
- Bad, because tier maintenance + commission-rule UI is non-trivial admin surface area.

### Consumer Prime subscription + flat commission (nursery-plan default)

- Good, because consumer subscriptions can become a meaningful revenue stream at scale (Amazon Prime model).
- Bad, because **no demonstrated B2B audience** for consumer subscriptions in corporate gifting.
- Bad, because Prime-style free-shipping commitments require us to absorb shipping costs we cannot price predictably (variable per-recipient address spread).

### Transaction-only revenue

- Good, because zero subscription billing complexity.
- Bad, because no incentive for vendors to commit (no upgrade path, no upsell vehicle, no premium tooling lever).
- Bad, because commission alone may not cover infrastructure costs at low GMV — see free-tier-burn analysis in PR-8.

### Marketplace ad placements + commission

- Good, because Sponsored Products is high-margin once volume exists.
- Bad, because ad placements need vendor inventory / catalog depth + buyer-side click volume that LotusGift won't have at MVP.
- Bad, because ad-placement infrastructure (ad-server, billing per click, attribution) is its own service module. Parked.

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), section 4 (REMOVED: Customer Prime; KEEP: vendor tiers + volume discounts + auto-replenish; `promotions-service` description), section 7 (Phase 14 `promotions-service`), section 7 (Phase 17 `apps/web-vendor`).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citation #1 (Razorpay Payment Gateway → settlements & recurring).
- Related ADRs:
  - [ADR-001](0001-india-launch-razorpay-and-carrier-aggregator.md) — Razorpay is the payment processor for auto-replenish subscriptions.
  - [ADR-007](0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) — corporate-buyer-org model that consumes auto-replenish.
