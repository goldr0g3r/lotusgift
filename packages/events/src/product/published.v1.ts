import {
  ProductCategoryL1Schema,
  ProductCategoryL2Schema,
  ProductOccasionSchema,
  UlidSchema,
  z,
} from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when a vendor flips a product
 * from `DRAFT` to `PUBLISHED`. Consumers:
 *
 * - P7 `atlas-search-sync.service` rebuilds the `product.search_index`
 *   row so the product surfaces in `/api/products/search`.
 * - P8 inventory-service primes per-(variantId, warehouseId) stock
 *   ledger rows for the product's variants (if missing).
 * - P12 notification-service sends a "your product is live!" email.
 * - Analytics emits `product published` downstream.
 */
export const VendorProductPublishedV1 = defineEvent(
  'product.published.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    slug: z.string(),
    title: z.string(),
    categoryL1: ProductCategoryL1Schema,
    categoryL2: ProductCategoryL2Schema,
    occasions: z.array(ProductOccasionSchema),
  }),
);

export type VendorProductPublishedV1Payload = z.infer<
  typeof VendorProductPublishedV1.schema
>['payload'];
