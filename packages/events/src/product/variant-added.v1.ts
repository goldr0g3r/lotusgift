import { UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when a vendor adds a new
 * variant to a product. Consumers:
 *
 * - P8 inventory-service initializes per-(variantId, warehouseId) stock
 *   ledger rows for the new variant.
 * - P7 `atlas-search-sync.service` bumps the product's `searchVersion`
 *   so cached search results invalidate.
 * - Analytics emits `variant added` downstream.
 *
 * `attributes` is shipped as a `Record<string, string>` (not a typed
 * `Map`) so consumers can persist + index the variant attributes
 * without re-deriving them from the product doc.
 */
export const VendorProductVariantAddedV1 = defineEvent(
  'product.variant-added.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    variantId: UlidSchema,
    sku: z.string(),
    attributes: z.record(z.string(), z.string()),
  }),
);

export type VendorProductVariantAddedV1Payload = z.infer<
  typeof VendorProductVariantAddedV1.schema
>['payload'];
