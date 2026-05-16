import { UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when a vendor updates an
 * existing variant on a product (price, attributes, barcode, dimensions,
 * weight, enabled flag, or SKU rename). Consumers:
 *
 * - P7 `atlas-search-sync.service` rebuilds the snapshot so
 *   `minVariantPricePaise` + `searchTerms` reflect the new state and
 *   stale price ranges don't surface in faceted search.
 * - P8 inventory-service may need to relabel ledger rows on SKU rename.
 * - Analytics emits `variant updated` downstream.
 *
 * Per `.cursor/rules/event-driven-discipline.mdc` every domain mutation
 * that bumps `searchVersion` MUST publish through the outbox in the
 * same Mongo transaction so the snapshot rebuild + outbox row commit
 * atomically.
 */
export const VendorProductVariantUpdatedV1 = defineEvent(
  'product.variant-updated.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    variantId: UlidSchema,
    sku: z.string(),
  }),
);

export type VendorProductVariantUpdatedV1Payload = z.infer<
  typeof VendorProductVariantUpdatedV1.schema
>['payload'];
