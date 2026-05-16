import type { ProductResponse, VariantResponse } from '@repo/validators';

import type { ProductDocument } from '../../schemas/product.schema.js';
import type { Variant } from '../../schemas/variant.schema.js';

/**
 * Map a `ProductDocument` (Mongoose) to the public-facing
 * `ProductResponse` shape Zod schema validates. Strips internal
 * fields + normalizes the variant subdoc-array.
 *
 * `availableStock` is populated by `product.service.batchGetStock`
 * via the `StockReadPort`; pass it in when known, otherwise we leave
 * the field `null` (M0 → P8 swap).
 */
export function mapProductToResponse(
  doc: ProductDocument,
  options: {
    imageR2Keys?: readonly string[];
    availableStockByVariant?: Map<string, number>;
  } = {},
): ProductResponse {
  const ratingAggregate = doc.ratingAggregate ?? { sum: 0, count: 0 };
  const averageRating =
    ratingAggregate.count > 0 ? ratingAggregate.sum / ratingAggregate.count : null;

  const variants = (doc.variants ?? []).map((v) => mapVariantToResponse(v));
  const variantStock = options.availableStockByVariant;
  const totalAvailableStock = variantStock
    ? variants.reduce((sum, v) => sum + (variantStock.get(v.id) ?? 0), 0)
    : null;

  return {
    id: doc.id as ProductResponse['id'],
    vendorId: doc.vendorId as ProductResponse['vendorId'],
    orgId: doc.orgId as ProductResponse['orgId'],
    title: doc.title,
    slug: doc.slug,
    descriptionMd: doc.descriptionMd,
    status: doc.status,
    categoryL1: doc.categoryL1,
    categoryL2: doc.categoryL2,
    occasions: [...doc.occasions],
    recipientTypes: [...doc.recipientTypes],
    customizable: doc.customizable,
    brandingAreas: [...doc.brandingAreas],
    moq: doc.moq,
    leadTimeDays: doc.leadTimeDays,
    sampleAvailable: doc.sampleAvailable,
    hsnCode: doc.hsnCode,
    basePricePaise: doc.basePricePaise,
    currency: 'INR',
    variants,
    imageR2Keys: [...(options.imageR2Keys ?? [])],
    averageRating,
    ratingCount: ratingAggregate.count,
    availableStock: totalAvailableStock,
    searchVersion: doc.searchVersion ?? 0,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function mapVariantToResponse(v: Variant): VariantResponse {
  return {
    id: v.id as VariantResponse['id'],
    sku: v.sku,
    attributes: { ...v.attributes },
    pricePaise: v.pricePaise,
    weightGrams: v.weightGrams,
    dimensionsMm: { ...v.dimensionsMm },
    barcode: v.barcode ?? undefined,
    enabled: v.enabled,
    createdAt: v.createdAt.toISOString(),
    updatedAt: v.updatedAt.toISOString(),
  };
}
