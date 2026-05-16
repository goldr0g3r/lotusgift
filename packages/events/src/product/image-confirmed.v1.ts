import { ImageKindSchema, R2ObjectKeySchema, UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` after a successful R2 image
 * upload + HEAD verification. Consumers:
 *
 * - P12 notification-service notifies vendor team members when a new
 *   product image is added (if the product is already PUBLISHED).
 * - P21 observability: tracks per-vendor upload volume vs the
 *   `R2_MAX_IMAGE_SIZE_BYTES` budget.
 * - Analytics emits `product image uploaded` downstream.
 */
export const VendorProductImageConfirmedV1 = defineEvent(
  'product.image-confirmed.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    imageId: UlidSchema,
    r2Key: R2ObjectKeySchema,
    kind: ImageKindSchema,
  }),
);

export type VendorProductImageConfirmedV1Payload = z.infer<
  typeof VendorProductImageConfirmedV1.schema
>['payload'];
