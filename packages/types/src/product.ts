import type { Brand } from './brand.js';

/**
 * Product-domain shared constants + types: corporate-gifting taxonomy
 * (occasions, recipient types, 2-level flat categories, branding areas),
 * product + review status enums, image kinds, and 2 branded scalars
 * consumed by product-service (P7), inventory-service (P8), order-service
 * (P9), and tax-service (P13).
 *
 * Layer placement: `@repo/types` is the L1 type-vocabulary package per
 * `.cursor/rules/architecture-layers.mdc`. Like `india.ts`, this file
 * deliberately ships paired runtime `const` arrays alongside the
 * literal-union types so Zod parsers in `@repo/validators/product` can
 * consume `z.enum(...)` against the exact same set of values.
 *
 * Sources (retrieval-dated 2026-05-15 — see docs/research/phase-7-product-service.md):
 * - Corporate gifting program types + occasions:
 *   https://birdiebox.com/pages/the-complete-guide-to-corporate-gifting-2026
 * - Top corporate gift categories 2026:
 *   https://brandmerch.com/guides/corporate-gifting
 * - India GST HSN code structure (4-8 digits):
 *   https://ondemandint.com/blog/add-hsn-code-on-gst-portal/
 * - Cloudflare R2 object-key constraints:
 *   https://developers.cloudflare.com/r2/objects/
 */

/**
 * Corporate-gifting occasion keys. Per [BirdieBox 2026 guide][1] +
 * [Brandmerch program types][2]: 7 primary gifting moments + 5 expanded
 * corporate-relationship occasions = 12 entries total.
 *
 * Multi-select on `product.products.occasions[]` — a single corporate
 * tea-set might be marketed for `client-appreciation` + `holiday-festive`
 * + `birthday`.
 *
 * [1]: https://birdiebox.com/pages/the-complete-guide-to-corporate-gifting-2026
 * [2]: https://brandmerch.com/guides/corporate-gifting
 */
export const PRODUCT_OCCASIONS = [
  'onboarding',
  'work-anniversary',
  'project-completion',
  'client-renewal',
  'holiday-festive',
  'conference',
  'industry-event',
  'employee-recognition',
  'birthday',
  'wellness',
  'sales-incentive',
  'thank-you',
] as const;

export type ProductOccasion = (typeof PRODUCT_OCCASIONS)[number];

/**
 * Recipient-type keys — the audience the gift targets. Drives the
 * web-customer faceted-search filter "Gifts for…".
 */
export const RECIPIENT_TYPES = [
  'employee',
  'client',
  'partner',
  'event-attendee',
  'self-purchase',
] as const;

export type RecipientType = (typeof RECIPIENT_TYPES)[number];

/**
 * Product lifecycle status. `DRAFT` is the post-create default;
 * `PUBLISHED` unblocks public read endpoints; `UNPUBLISHED` hides the
 * product but preserves the doc + variant SKUs (for re-publishing);
 * `ARCHIVED` is terminal soft-delete (the doc stays for order history
 * + payouts ledger references but never surfaces in catalog reads).
 */
export const PRODUCT_STATUS_KEYS = [
  'DRAFT',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
] as const;

export type ProductStatus = (typeof PRODUCT_STATUS_KEYS)[number];

/**
 * 2-level flat category structure — top-level (L1) parent categories for
 * the corporate-gifting domain. Per Q3 / D4 — N-level tree rejected for
 * MVP because the web-customer faceted-search UI (P16) renders better
 * against a flat 2-level. Forward-compat: `categoryL3` can be added
 * later as an additive PR without breaking the L1+L2 contract.
 *
 * Source: Brandstik 2026 top corporate gift categories report.
 */
export const PRODUCT_CATEGORY_L1_KEYS = [
  'drinkware',
  'apparel',
  'tech-accessories',
  'desk-accessories',
  'gourmet-food',
  'wellness',
  'eco-sustainable',
  'stationery',
  'gift-cards-vouchers',
  'experience-vouchers',
  'curated-gift-sets',
  'home-decor',
] as const;

export type ProductCategoryL1 = (typeof PRODUCT_CATEGORY_L1_KEYS)[number];

/**
 * 2-level flat category structure — leaf (L2) categories. Paired with
 * `PRODUCT_CATEGORY_L1_KEYS` via the `PRODUCT_CATEGORY_L1_TO_L2` map; a
 * product's `categoryL2` must belong to its declared `categoryL1`
 * (validated in Zod `superRefine`).
 *
 * 50 entries covering the most common corporate-gifting SKU types per
 * the Brandstik 2026 categories report + BirdieBox 2026 guide.
 */
export const PRODUCT_CATEGORY_L2_KEYS = [
  // drinkware
  'mug',
  'bottle-stainless-steel',
  'bottle-glass',
  'tumbler',
  'french-press',
  // apparel
  'tshirt',
  'hoodie',
  'jacket',
  'cap',
  'tote-bag',
  // tech-accessories
  'power-bank',
  'wireless-charger',
  'bluetooth-speaker',
  'earbuds',
  'usb-hub',
  'laptop-stand',
  // desk-accessories
  'notebook',
  'pen-premium',
  'desk-organizer',
  'mouse-pad',
  // gourmet-food
  'tea-set',
  'coffee-set',
  'chocolate-box',
  'dry-fruits-box',
  'sweets-box',
  // wellness
  'yoga-mat',
  'aromatherapy-set',
  'fitness-tracker',
  'massage-tool',
  // eco-sustainable
  'reusable-cutlery',
  'bamboo-utensils',
  'seed-paper-set',
  'plantable-pencil',
  // stationery
  'planner',
  'journal',
  'sticky-notes-set',
  'calligraphy-set',
  // gift-cards-vouchers
  'amazon-voucher',
  'flipkart-voucher',
  'multi-brand-voucher',
  // experience-vouchers
  'spa-voucher',
  'dining-voucher',
  'staycation-voucher',
  'adventure-voucher',
  // curated-gift-sets
  'welcome-kit',
  'festival-hamper',
  'wellness-bundle',
  'work-from-home-kit',
  // home-decor
  'plant-indoor',
  'candle-aromatherapy',
  'photo-frame',
  'wall-art',
] as const;

export type ProductCategoryL2 = (typeof PRODUCT_CATEGORY_L2_KEYS)[number];

/**
 * Parent-pointer lookup — for each L2 leaf category, the L1 parent it
 * belongs to. Validated in `@repo/validators/product/product-row.ts`
 * `superRefine` so `categoryL1` + `categoryL2` always form a valid pair.
 */
export const PRODUCT_CATEGORY_L1_TO_L2: Readonly<
  Record<ProductCategoryL2, ProductCategoryL1>
> = {
  // drinkware
  mug: 'drinkware',
  'bottle-stainless-steel': 'drinkware',
  'bottle-glass': 'drinkware',
  tumbler: 'drinkware',
  'french-press': 'drinkware',
  // apparel
  tshirt: 'apparel',
  hoodie: 'apparel',
  jacket: 'apparel',
  cap: 'apparel',
  'tote-bag': 'apparel',
  // tech-accessories
  'power-bank': 'tech-accessories',
  'wireless-charger': 'tech-accessories',
  'bluetooth-speaker': 'tech-accessories',
  earbuds: 'tech-accessories',
  'usb-hub': 'tech-accessories',
  'laptop-stand': 'tech-accessories',
  // desk-accessories
  notebook: 'desk-accessories',
  'pen-premium': 'desk-accessories',
  'desk-organizer': 'desk-accessories',
  'mouse-pad': 'desk-accessories',
  // gourmet-food
  'tea-set': 'gourmet-food',
  'coffee-set': 'gourmet-food',
  'chocolate-box': 'gourmet-food',
  'dry-fruits-box': 'gourmet-food',
  'sweets-box': 'gourmet-food',
  // wellness
  'yoga-mat': 'wellness',
  'aromatherapy-set': 'wellness',
  'fitness-tracker': 'wellness',
  'massage-tool': 'wellness',
  // eco-sustainable
  'reusable-cutlery': 'eco-sustainable',
  'bamboo-utensils': 'eco-sustainable',
  'seed-paper-set': 'eco-sustainable',
  'plantable-pencil': 'eco-sustainable',
  // stationery
  planner: 'stationery',
  journal: 'stationery',
  'sticky-notes-set': 'stationery',
  'calligraphy-set': 'stationery',
  // gift-cards-vouchers
  'amazon-voucher': 'gift-cards-vouchers',
  'flipkart-voucher': 'gift-cards-vouchers',
  'multi-brand-voucher': 'gift-cards-vouchers',
  // experience-vouchers
  'spa-voucher': 'experience-vouchers',
  'dining-voucher': 'experience-vouchers',
  'staycation-voucher': 'experience-vouchers',
  'adventure-voucher': 'experience-vouchers',
  // curated-gift-sets
  'welcome-kit': 'curated-gift-sets',
  'festival-hamper': 'curated-gift-sets',
  'wellness-bundle': 'curated-gift-sets',
  'work-from-home-kit': 'curated-gift-sets',
  // home-decor
  'plant-indoor': 'home-decor',
  'candle-aromatherapy': 'home-decor',
  'photo-frame': 'home-decor',
  'wall-art': 'home-decor',
};

/**
 * Branding-area keys — the printable / engravable surface(s) on a
 * product where the customer's logo or message can be applied. Per
 * product customization-area enums in the corporate-gifting domain.
 *
 * Multi-select on `product.products.brandingAreas[]`. The actual art
 * placement + mockup workflow lives in P8b customization-service.
 */
export const BRANDING_AREA_KEYS = [
  'front-print',
  'back-print',
  'sleeve-print',
  'engraving',
  'embroidery',
  'sticker-label',
] as const;

export type BrandingArea = (typeof BRANDING_AREA_KEYS)[number];

/**
 * Product image kind. `hero` is the single PDP hero shot; `gallery` for
 * additional product photography; `mockup` for customer-supplied logo
 * preview (rendered in P8b customization-service).
 */
export const IMAGE_KIND_KEYS = ['hero', 'gallery', 'mockup'] as const;
export type ImageKind = (typeof IMAGE_KIND_KEYS)[number];

/**
 * Product review moderation status. `PENDING` is the buyer-submit
 * default; admin moderation flips to `APPROVED` (publicly visible) or
 * `REJECTED` (hidden + reason logged).
 */
export const REVIEW_STATUS_KEYS = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUS_KEYS)[number];

/**
 * India GST HSN (Harmonized System of Nomenclature) code. Per CBIC GST
 * rules: 2-digit chapter / 4-digit heading / 6-digit international
 * sub-heading / 8-digit India-specific national classification. We
 * accept 4-8 digits at product-create time; P13 tax-service performs
 * the live CBIC registry validation at order-line tax-compute time.
 *
 * Source: https://ondemandint.com/blog/add-hsn-code-on-gst-portal/
 */
export type HsnCode = Brand<string, 'HsnCode'>;

/**
 * Cloudflare R2 object key for a product image. Branded so the compiler
 * stops accidental string-to-R2-key coercion. Format constraints
 * enforced by `R2ObjectKeySchema` in `@repo/validators/scalars`: no
 * leading `/`, no `//`, no `..`, ≤1024 bytes.
 */
export type R2ImageKey = Brand<string, 'R2ImageKey'>;
