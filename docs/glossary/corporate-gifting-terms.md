# Corporate gifting terms

**Audience**: every contributor + coding agents
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Domain-specific vocabulary for the LotusGift v2 corporate gifting marketplace.

---

## Auto-router

The decision engine that routes an order to either the **instant cart** flow (small quantity, no customization) or the **RFQ** flow (large quantity, requires customization, exceeds MOQ). Configurable per-vendor with platform defaults. See [`ADR-0007`](../adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md).

## Art upload

The first step of the customization workflow: the buyer uploads vector/raster artwork (logo, message, design) to be applied to a product. Stored in Cloudflare R2 via presigned URL.

## Cart (instant)

The standard e-commerce flow for small orders that don't trigger the auto-router's RFQ threshold. Stock is reserved immediately via Redis-backed reservations with TTL expiry.

## Corporate buyer

A business entity purchasing gifts in bulk for employees, clients, or events. Distinguished from retail buyers by: higher MOQ tolerance, PO/credit payment terms, recipient-list capability, and organization-level accounts (Better-Auth Organization plugin).

## Customization

The end-to-end workflow for applying buyer-specified branding to products: art upload → vendor mockup generation → buyer approval → production audit trail. Managed by `services/customization-service`.

## Drop-shipping (recipient-list)

Shipping individual personalized packages directly from warehouse to each recipient address, bypassing the buyer's location. Triggered by recipient-list upload.

## MOQ (Minimum Order Quantity)

The minimum number of units a vendor requires for a given product/customization. When a cart exceeds a product's MOQ threshold, the auto-router redirects to RFQ.

## Mockup

A vendor-generated preview of how the buyer's art will appear on the product. Part of the customization approval thread. Must be approved by the buyer before production begins.

## Multi-vendor

A marketplace model where multiple independent vendors list products. LotusGift aggregates across vendors, handles routing, and manages the buyer experience.

## Multi-warehouse

A vendor may have stock across multiple physical locations. The inventory service routes orders to the warehouse closest to the recipient (geographic proximity or rules-based).

## Personalization

Per-recipient customization within a recipient-list order — e.g., each gift bag has the recipient's name printed. Distinguished from bulk customization (same art for all units).

## Recipient-list

A CSV upload containing N recipients, each with: name, address, phone, and optional per-recipient personalization fields. Triggers N individual shipments from the selected warehouse. Core LotusGift differentiator. See [`ADR-0007`](../adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md).

## RFQ (Request for Quote)

The negotiation flow triggered by the auto-router for large/complex orders. Buyer submits requirements → vendors respond with quotes (price, timeline, MOQ terms) → buyer accepts → order created. Managed by `services/rfq-service`.

## Stock ledger

The source-of-truth for inventory quantities, maintained per-warehouse per-variant in `services/inventory-service`. Uses atomic Mongo operations to prevent race conditions.

## Stock reservation

A time-limited hold on inventory quantity (Redis-backed with TTL). Created when items are added to cart. Released on cart abandonment (TTL expiry) or converted to a committed decrement on order placement.

## Vendor tier

The monetization level for a vendor on the platform (e.g., Basic, Pro, Enterprise). Determines commission rate, feature access, and priority in search results. See [`ADR-0003`](../adr/0003-vendor-tiered-monetization-no-customer-prime.md).

## Warehouse routing

The algorithm that selects which warehouse fulfils a given order line item. Considers: proximity to recipient, stock availability, vendor preference, shipping cost. Part of `services/inventory-service`.
