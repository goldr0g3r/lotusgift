/**
 * Shared enums used across services + apps. Every enum here has a paired
 * runtime `z.enum()` schema in `@repo/validators/enums` for parsing
 * untrusted input.
 *
 * Per `.cursor/rules/architecture-layers.mdc`, this module is L1
 * type-level only — no runtime values.
 */

/**
 * Kind of Better-Auth organization. Three types per parent plan §4:
 * - `vendor-org` — self-serve onboarding + admin approval gate
 * - `corporate-buyer-org` — B2B buyers with KYC + PO terms + credit limit
 * - `internal-staff-org` — LotusGift staff teams
 *
 * Individual retail buyers still allowed (no org membership).
 */
export type OrgKind = 'vendor-org' | 'corporate-buyer-org' | 'internal-staff-org';

/**
 * User role within their org context. Concrete role permissions land in
 * P5 (services/auth-service).
 */
export type UserRole =
  | 'owner'
  | 'admin'
  | 'member'
  | 'warehouse-manager'
  | 'inventory-manager'
  | 'finance'
  | 'customer-service';

/**
 * Order aggregate status (covers cart-routed orders; RFQ-routed drafts
 * use `RfqStatus` instead).
 */
export type OrderStatus =
  | 'draft'
  | 'placed'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

/**
 * Per-shipment status within an order (an Order aggregates N Shipments).
 */
export type ShipmentStatus =
  | 'pending'
  | 'picked'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'rto_in_transit'
  | 'rto_delivered'
  | 'cancelled';

/**
 * Payment status. Razorpay-aligned for online payments; PO + credit-terms
 * orders for corporate-buyer-orgs use the same enum.
 */
export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

/**
 * Quote workflow status per parent plan §4 (P9b rfq-service).
 */
export type RfqStatus =
  | 'draft'
  | 'sent'
  | 'negotiating'
  | 'accepted'
  | 'rejected'
  | 'expired';

/**
 * Customization-request state machine per `.cursor/rules/corporate-gifting-domain.mdc`
 * (P8b customization-service). Transitions enforced by a state-machine
 * guard; backwards transitions reject.
 */
export type CustomizationStatus =
  | 'draft'
  | 'art_uploaded'
  | 'mockup_pending'
  | 'mockup_delivered'
  | 'approved'
  | 'rejected'
  | 'in_production';

/**
 * Recipient-list upload status per parent plan §4 (P9c
 * recipient-list-service). Failed validation rejects the entire upload
 * atomically (no partial commits).
 */
export type RecipientListUploadStatus =
  | 'pending'
  | 'validating'
  | 'validated'
  | 'rejected'
  | 'order_created'
  | 'order_failed';
