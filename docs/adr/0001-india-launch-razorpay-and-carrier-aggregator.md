# India-only launch with Razorpay payments and a carrier-aggregator pool

- **Status:** accepted
- **Date:** 2026-05-12
- **Decision-makers:** @goldr0g3r
- **Consulted:** parent-plan authors (nursery-plan adaptation), corporate-gifting domain rule
- **Informed:** all future service authors (especially `payment-service`, `shipping-service`, `tax-service`)

## Context and Problem Statement

LotusGift v2 is a greenfield rebuild of a single-vendor RFQ site into a multi-vendor multi-warehouse corporate-gifting marketplace. The previous codebase ([`_old/apps/api/src/payments`](../../_old/apps/api/src/payments)) already used Razorpay; the parent plan ([`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md) §4 and §9) commits the rebuild to an India-only launch on Razorpay with a multi-carrier shipping aggregator. This ADR ratifies that scope so future contributors don't waste cycles on multi-currency / global-payments / direct-carrier-integration paths.

## Decision Drivers

- Corporate-gifting buyers are India-resident B2B entities with INR-denominated POs and GSTIN-bearing invoices.
- The free-tier budget rules out paying for currency conversion, fraud-screening, or carrier-side rate negotiation up front.
- The `_old` codebase already proves Razorpay integration end-to-end (Better-Auth-mounted raw-body webhook handler at `/api/payments/webhook`); preserving that pattern saves the most time.
- GST e-invoicing through the IRP is mandatory above the central-board-of-indirect-taxes-and-customs AATO threshold (₹5 crore as of mid-2023; possibly lower by 2026 — see research note §2 row 16, P13 research note will confirm definitive number).
- Founder bandwidth is small; the carrier integration cannot block on multiple direct integrations.

## Considered Options

- **India-only launch on Razorpay with Shiprocket-primary + Delhivery + Bluedart aggregator pool.** [chosen]
- Global from day 1 with Stripe / PayPal and direct integrations to FedEx / DHL.
- India + USA launch on dual payment processors (Razorpay + Stripe) with manual currency switching.
- India-only on Cashfree / PayU / PhonePe gateway instead of Razorpay.

## Decision Outcome

Chosen option: **"India-only launch on Razorpay with Shiprocket-primary + Delhivery + Bluedart aggregator pool"**, because it minimises operational surface area (one payment processor, one shipping aggregator covering 19 000+ pin codes via 42+ courier partners), preserves the proven `_old` payment integration pattern, and aligns with the corporate-gifting buyer's expectation of INR / GST / e-invoice / COD support out of the box.

Concrete scope:

- **Currency:** INR only at MVP. Multi-currency parked indefinitely (revisit if international vendors onboard).
- **Timezone:** IST (`Asia/Kolkata`) for all server-rendered timestamps, cron schedules, and analytics buckets. Database stores UTC.
- **Payment methods (Razorpay):** UPI, debit + credit cards (domestic + international cards permitted), netbanking, wallets (Paytm, PhonePe), EMI, Cardless EMI, **COD allowed** (with risk scoring on cart value), and **PO + credit-terms** for approved `corporate-buyer-org` (Net-15 / Net-30 with credit-limit enforcement — see ADR-007 and parent-plan §4 payment-service).
- **Shipping aggregator:** **Shiprocket as primary** (19 000+ pin codes, 42+ courier partners under one contract, 250+ ecosystem integrations, SDKs for Node) with **Delhivery and Bluedart as direct fallbacks** for premium / time-definite shipments. The `shipping-service` exposes a unified internal contract; the aggregator-vs-direct routing lives behind it.
- **Tax:** GST per-shipment computed by `tax-service` (origin state = fulfilling-warehouse state; destination state = recipient-address state). CGST/SGST split for intra-state; IGST for inter-state. IRP e-invoice generated per shipment for B2B orders (corporate-buyer-org with GSTIN). Default-on for B2B; conditional for B2C above the AATO threshold (P13 confirms).
- **No anonymous / guest checkout:** all paid orders require an authenticated user (parent-plan §4). Retail individual accounts allowed but must register.

### Consequences

- Good, because the operational surface area (one payment processor + one aggregator + one tax regime) keeps the team-of-one founder productive through P22.
- Good, because the `_old` Razorpay webhook pattern (raw-body capture before NestJS body parser, HMAC verify) ports straight into the new `payment-service` (parent-plan §6 "Extract into the new workspace").
- Good, because Shiprocket's 19 000+ pin codes match LotusGift's nationwide corporate-gifting recipient address spread without us renegotiating per-carrier contracts.
- Bad, because international vendors and overseas corporate buyers (NRI gifting, MNC India offices billing US parent) are explicitly out of scope at MVP; an explicit "we don't ship outside India" landing-page banner is required.
- Bad, because Razorpay outages affect 100 % of paid orders (no payment-processor failover). Mitigation: post-launch, evaluate Cashfree as a secondary; tracked in `scaling-up.md` runbook (PR-8).
- Neutral, because the carrier aggregator hides per-courier features (e.g., Bluedart's domestic priority lanes, Delhivery's NDR redressal flows). Mitigation: `shipping-service` exposes carrier-specific hooks where the contract permits.

### Confirmation

- `payment-service` integration tests assert: Razorpay HMAC signature verify on `/api/payments/webhook`, idempotency on duplicate `payment.captured` events, COD risk-score blocks above the configured cart-value ceiling.
- `shipping-service` integration tests assert: Shiprocket rate-card returns ≥ 3 carrier options for the canonical Mumbai → Delhi corporate-address pair; failover to Delhivery / Bluedart when Shiprocket returns 5xx.
- `tax-service` integration tests assert: CGST/SGST split for intra-state Maharashtra → Maharashtra; IGST for inter-state Maharashtra → Karnataka; IRP e-invoice payload generated for orders with `corporate-buyer-org.gstin` present.
- ADR-005 confirms the deployment regions (Oracle Mumbai + AWS Mumbai Atlas) align with this India-only posture.

## Pros and Cons of the Options

### India-only launch on Razorpay with Shiprocket-primary + Delhivery + Bluedart [chosen]

- Good, because preserves the proven `_old` Razorpay pattern (zero re-learning).
- Good, because Shiprocket aggregates 42+ couriers via one contract → fastest path to nationwide coverage.
- Good, because Razorpay supports UPI + COD + netbanking + cards + EMI in one API (vs. Stripe's card-centric API).
- Good, because Razorpay handles INR settlement reconciliation natively (citation #1).
- Bad, because every additional country needs a new ADR + significant engineering (currency, regulatory, carriers).

### Global from day 1 with Stripe / PayPal + direct carrier integrations

- Good, because future-proofs the product for cross-border B2B gifting.
- Bad, because requires multi-currency UX, FX risk hedging, US/EU compliance (PCI-DSS Level 1, GDPR, SCA / 3DS2), and per-carrier API integrations — none of which fit the team-of-one constraint.
- Bad, because Razorpay's COD and UPI are non-replaceable in the India market; abandoning them costs conversion.

### India + USA launch on Razorpay + Stripe (dual processors)

- Good, because preserves India launch velocity while opening US optionality.
- Bad, because dual reconciliation pipelines, dual fraud screens, and dual webhook handlers roughly double the `payment-service` complexity — not worth it pre-product-market-fit.

### India-only on Cashfree / PayU / PhonePe gateway

- Good, because Cashfree has competitive UPI Settlement T+0 in some plans, PayU has historically lower MDR on certain card BINs.
- Bad, because none have the demonstrated integration pattern in the `_old` codebase, costing weeks to re-prove the webhook + raw-body capture pattern.
- Neutral, because all three are credible Razorpay alternatives if Razorpay-specific risks materialise (see "scaling-up" runbook).

## More Information

- Parent plan: [`.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md`](../../.cursor/plans/lotusgift_v2_architecture_rebuild_512d4adf.plan.md), sections 4 (`payment-service`, `shipping-service`, `tax-service`), 9 (hosting + free-tier strategy).
- Research note: [`docs/research/phase-0-docs.md`](../research/phase-0-docs.md), citations #1 (Razorpay payment gateway), #2 (Razorpay payment methods), #3 (Shiprocket), #4 (Blue Dart), #5 (Delhivery), #16 (GST e-invoicing background).
- Related ADRs:
  - [ADR-005](0005-hosting-oracle-mumbai-plus-vercel.md) — aligns hosting region (Mumbai) with this India-only posture.
  - [ADR-007](0007-corporate-gifting-deltas-rfq-customization-recipient-list.md) — clarifies B2B PO + credit-terms requirement and recipient-list-driven multi-shipment GST handling.
- Reusable `_old` artefacts:
  - [`_old/apps/api/src/payments/payments.service.ts`](../../_old/apps/api/src/payments/payments.service.ts) — Razorpay signature verify + webhook idempotency.
  - [`_old/apps/api/src/main.ts`](../../_old/apps/api/src/main.ts) — raw-body capture before NestJS body parser for `/api/payments/webhook`.
