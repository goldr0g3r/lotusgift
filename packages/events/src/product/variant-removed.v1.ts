import { UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/product-service` when a vendor removes a
 * variant from a product. Consumers:
 *
 * - P7 `atlas-search-sync.service` rebuilds the snapshot so the removed
 *   variant stops contributing to `minVariantPricePaise` + `searchTerms`
 *   (without this, a removed variant would silently keep showing in
 *   faceted search at its old price band).
 * - P8 inventory-service archives ledger rows for the removed variant.
 * - Analytics emits `variant removed` downstream.
 *
 * Per `.cursor/rules/event-driven-discipline.mdc` every domain mutation
 * that bumps `searchVersion` MUST publish through the outbox in the
 * same Mongo transaction so the snapshot rebuild + outbox row commit
 * atomically.
 */
export const VendorProductVariantRemovedV1 = defineEvent(
  'product.variant-removed.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    productId: UlidSchema,
    variantId: UlidSchema,
    sku: z.string(),
  }),
);

export type VendorProductVariantRemovedV1Payload = z.infer<
  typeof VendorProductVariantRemovedV1.schema
>['payload'];
