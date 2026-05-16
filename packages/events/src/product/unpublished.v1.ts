import { UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when a vendor or admin
 * unpublishes a product (status `PUBLISHED → UNPUBLISHED`). Consumers:
 *
 * - P7 `atlas-search-sync.service` removes the row from
 *   `product.search_index` so the product stops surfacing in search.
 * - P12 notification-service notifies the vendor when an admin
 *   unpublishes (e.g. for policy violation).
 * - Analytics emits `product unpublished` downstream.
 */
export const VendorProductUnpublishedV1 = defineEvent(
  'product.unpublished.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    reason: z.string().nullable(),
  }),
);

export type VendorProductUnpublishedV1Payload = z.infer<
  typeof VendorProductUnpublishedV1.schema
>['payload'];
