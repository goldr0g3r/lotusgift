# LotusGift v2 — Analytics event catalog

Single source of truth for every PostHog event emitted by the platform. Per [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc):

- Event names follow `[object] [verb]` in lowercase (e.g. `order placed`, NEVER `orderPlaced`).
- Server-side events route through [`@repo/analytics-sdk/server`](../../packages/analytics-sdk/src/server.ts) which auto-redacts PII via [`@repo/utils.redact`](../../packages/utils/src/redactor.ts).
- Browser-side events use [`@repo/analytics-sdk/browser`](../../packages/analytics-sdk/src/browser.ts) (no auto-redaction; user-owned data only).
- Every event has a paired domain schema in [`@repo/events/<service>`](../../packages/events/) once the owning service ships (P5+).

Adding a new event:

1. Add a row to the appropriate table below (alphabetical within table).
2. Add the event-emit call in the consuming service's `*.service.ts`.
3. If the event triggers a notification, add the consumer to the "Consumed by" column.
4. Update this doc in the SAME PR as the producing service phase.

## Auth + Org (P5)

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `user registered` | New account created (any provider) | `auth-service` | `notification-service`, `insights-service` | `user_id`, `org_kind?`, `provider` (`password\|google\|passkey`) |
| `user logged-in` | Successful auth | `auth-service` | `insights-service` | `user_id`, `org_kind?`, `provider`, `is_first_session` |
| `user verified-email` | Email confirmation click-through | `auth-service` | `insights-service` | `user_id` |
| `2fa enabled` | TOTP / passkey activation | `auth-service` | `insights-service` | `user_id`, `method` (`totp\|webauthn`) |
| `org created` | Vendor / corporate-buyer / internal-staff org spawn | `auth-service` | `notification-service`, `insights-service` | `org_id`, `org_kind`, `created_by` |
| `org member-added` | New seat in any org | `auth-service` | `insights-service` | `org_id`, `org_kind`, `role` |
| `admin impersonated` | Admin plugin impersonation event | `auth-service` | `insights-service` (audit) | `admin_id`, `target_user_id` |

## Vendor (P6)

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `vendor onboarding-started` | First step of self-serve wizard | `vendor-service` | `insights-service` | `org_id` |
| `vendor kyc-submitted` | GSTIN + PAN + bank uploaded | `vendor-service` | `notification-service` (admin queue), `insights-service` | `org_id`, `kyc_id` |
| `vendor activated` | Admin approval grant | `vendor-service` | `notification-service` (vendor), `insights-service` | `org_id`, `approved_by` |
| `warehouse added` | New warehouse registration | `vendor-service` | `insights-service` | `org_id`, `warehouse_id`, `state` |
| `vendor tier-upgraded` | Tier change (paid plan) | `vendor-service` | `notification-service`, `insights-service` | `org_id`, `from_tier`, `to_tier` |

## Product + Inventory (P7, P8)

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `product listed` | New product publish (post-approval) | `product-service` | `insights-service` | `product_id`, `org_id`, `category_id`, `customizable` |
| `product unpublished` | Vendor/admin hide | `product-service` | `insights-service` | `product_id`, `org_id`, `reason` |
| `stock low-threshold-hit` | Per-warehouse stock < reorder point | `inventory-service` | `notification-service` (vendor), `insights-service` | `variant_id`, `warehouse_id`, `qty` |
| `stock dead-stock-flagged` | 60-day no-sale + > N units | `inventory-service` | `notification-service`, `insights-service` | `variant_id`, `warehouse_id`, `days_idle` |

## Customization + RFQ + Recipient-list (P8b, P9b, P9c) — corporate-gifting deltas

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `art uploaded` | Buyer uploads art file to R2 | `customization-service` | `notification-service` (vendor) | `customization_id`, `version`, `file_type` (`ai\|pdf\|png`) |
| `mockup delivered` | Vendor uploads mockup | `customization-service` | `notification-service` (buyer) | `customization_id`, `mockup_id` |
| `mockup approved` | Buyer approves | `customization-service` | `notification-service` (vendor), `insights-service` | `customization_id`, `time_to_approve_seconds` |
| `mockup rejected` | Buyer rejects with notes | `customization-service` | `notification-service` (vendor) | `customization_id`, `notes_length` |
| `customization in-production` | Vendor marks production-start | `customization-service` | `notification-service` (buyer) | `customization_id` |
| `quote opened` | RFQ draft created (auto-router or manual) | `rfq-service` | `notification-service` (buyer), `insights-service` | `quote_id`, `auto_routed`, `line_count`, `value_paise` |
| `quote sent` | Vendor sends quote to buyer | `rfq-service` | `notification-service` (buyer) | `quote_id`, `valid_until` |
| `quote accepted` | Buyer accepts | `rfq-service` | `notification-service` (vendor), `order-service` (converts to PO), `insights-service` | `quote_id`, `order_id`, `value_paise` |
| `quote rejected` | Buyer or vendor rejects | `rfq-service` | `notification-service` | `quote_id`, `rejected_by` (`buyer\|vendor`), `reason?` |
| `quote expired` | `valid_until` passes without accept | `rfq-service` | `notification-service` (buyer) | `quote_id` |
| `recipient-list uploaded` | CSV/Excel parse success | `recipient-list-service` | `insights-service` | `list_id`, `row_count`, `org_id` |
| `recipient-list validation-failed` | Schema rejection | `recipient-list-service` | `notification-service` (uploader) | `list_id`, `failed_row_count` |
| `order routed-to-rfq` | Auto-router decides RFQ at checkout | `order-service` | `rfq-service` (creates quote), `insights-service` | `cart_id`, `trigger` (`moq\|value\|customization`) |

## Order + Payment + Shipping + Tax (P9, P10, P11, P13)

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `order placed` | Cart-routed order persisted | `order-service` | `notification-service`, `inventory-service` (reservation), `payment-service`, `insights-service` | `order_id`, `gmv_paise`, `shipment_count`, `recipient_count`, `route` (`cart\|rfq`) |
| `order cancelled` | Pre-fulfilment cancel | `order-service` | `notification-service`, `inventory-service` (release), `payment-service` (refund) | `order_id`, `cancelled_by` (`buyer\|vendor\|admin`), `reason?` |
| `order fulfilled` | All shipments delivered | `order-service` | `notification-service`, `insights-service` | `order_id`, `total_lead_days` |
| `payment captured` | Razorpay capture webhook | `payment-service` | `order-service` (advance status), `notification-service`, `insights-service` | `payment_id`, `order_id`, `amount_paise`, `method` (`upi\|card\|netbanking\|wallet\|po`) |
| `payment refunded` | Refund issued | `payment-service` | `notification-service`, `insights-service` | `payment_id`, `order_id`, `amount_paise`, `reason` |
| `po credit-extended` | Net-15/30 PO approved | `payment-service` | `notification-service`, `insights-service` | `order_id`, `org_id`, `terms` (`net-15\|net-30`), `credit_used_paise` |
| `shipment picked` | Carrier pickup confirmed | `shipping-service` | `notification-service`, `insights-service` | `shipment_id`, `order_id`, `warehouse_id`, `carrier` |
| `shipment delivered` | Carrier delivery webhook | `shipping-service` | `order-service` (mark shipment), `notification-service`, `insights-service` | `shipment_id`, `order_id`, `lead_days` |
| `shipment rto-initiated` | Return-to-origin start | `shipping-service` | `inventory-service` (return stock), `notification-service` | `shipment_id`, `order_id`, `reason` |
| `e-invoice generated` | IRP push success | `tax-service` | `notification-service` (admin), `insights-service` | `shipment_id`, `e_invoice_id`, `gstin` |

## Promotions + Insights + Reviews + Support (P14, P15, P20)

| Event | Trigger | Producer | Consumed by | Properties |
| --- | --- | --- | --- | --- |
| `coupon redeemed` | Coupon applied at checkout | `promotions-service` | `insights-service` | `coupon_id`, `order_id`, `discount_paise` |
| `subscription renewed` | Auto-replenish charge | `promotions-service` | `notification-service`, `insights-service` | `subscription_id`, `order_id`, `cycle_n` |
| `insight viewed` | Vendor opens an insights dashboard card | `web-vendor` (browser) | `insights-service` (PostHog autocapture is fine) | `card_id`, `viewer_id` |
| `review submitted` | Buyer rates product / vendor | `review-service` | `insights-service`, `notification-service` (vendor) | `review_id`, `product_id`, `rating`, `has_photo` |
| `ticket opened` | Support ticket created | `support-service` | `notification-service` (cs team) | `ticket_id`, `org_id?`, `subject_kind` |
| `ticket resolved` | CS closes ticket | `support-service` | `insights-service`, `notification-service` (requester) | `ticket_id`, `resolution_kind`, `time_to_resolve_minutes` |

## Browser-only (web apps, P16-P19)

| Event | Trigger | App | Properties |
| --- | --- | --- | --- |
| `hero scrolled` | User scrolls past hero | `web-customer` | `variant?` |
| `pdp viewed` | PDP route hit | `web-customer` | `product_id` |
| `cart add-clicked` | Add-to-cart CTA | `web-customer` | `product_id`, `qty` |
| `checkout step-completed` | Checkout step N → N+1 | `web-customer` | `step`, `step_n` |
| `quote thread-viewed` | RFQ thread loaded | `web-customer` | `quote_id` |
| `wizard step-completed` | Vendor / admin wizard step | `web-vendor`, `web-admin` | `wizard`, `step` |

Server-side autocapture for autocapture-eligible browser events (pageviews, clicks, form submits) is delegated to PostHog's default behavior; the events above are explicit `posthog.capture()` calls that need bespoke properties.

## Person properties (set via `analytics.identify(...)`)

Set once on user identification + on relevant updates. Use `$set` (overwrite) for mutable fields, `$set_once` (write-once) for immutable ones.

| Property | Set strategy | Source |
| --- | --- | --- |
| `user_id` (distinct ID) | identify | `@repo/types/UlidString` |
| `org_id` | `$set` | active org context |
| `org_kind` | `$set` | `vendor-org\|corporate-buyer-org\|internal-staff-org` |
| `corporate_buyer_org_id` | `$set` | when buyer is part of a corporate-buyer-org |
| `vendor_tier` | `$set` | current paid plan |
| `signup_date` | `$set_once` | RFC 3339 date |
| `signup_provider` | `$set_once` | `password\|google\|passkey` |
| `kyc_status` | `$set` | `pending\|approved\|rejected` |

Never set raw email / phone / PAN / Aadhaar / GSTIN as person properties — the `@repo/utils.redact` default paths reject these at the server boundary.
