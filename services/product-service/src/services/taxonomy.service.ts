import { Injectable } from '@nestjs/common';

import {
  BRANDING_AREA_KEYS,
  PRODUCT_CATEGORY_L1_KEYS,
  PRODUCT_CATEGORY_L1_TO_L2,
  PRODUCT_CATEGORY_L2_KEYS,
  PRODUCT_OCCASIONS,
  RECIPIENT_TYPES,
  type ProductCategoryL1,
  type ProductCategoryL2,
} from '@repo/types';

/**
 * Public read-only API exposing the corporate-gifting taxonomy. Backs
 * `GET /api/product-taxonomy` — consumed by the web-customer faceted
 * search UI (P16) + the web-vendor catalog editor (P17) so the option
 * lists stay in lockstep with the server-side enums without hand-rolled
 * config duplication.
 */
@Injectable()
export class TaxonomyService {
  getTaxonomy(): {
    occasions: readonly string[];
    recipientTypes: readonly string[];
    brandingAreas: readonly string[];
    categories: ReadonlyArray<{
      l1: ProductCategoryL1;
      children: ProductCategoryL2[];
    }>;
  } {
    const grouped = new Map<ProductCategoryL1, ProductCategoryL2[]>();
    for (const l1 of PRODUCT_CATEGORY_L1_KEYS) grouped.set(l1, []);
    for (const l2 of PRODUCT_CATEGORY_L2_KEYS) {
      const parent = PRODUCT_CATEGORY_L1_TO_L2[l2];
      const bucket = grouped.get(parent);
      if (bucket) bucket.push(l2);
    }
    return {
      occasions: PRODUCT_OCCASIONS,
      recipientTypes: RECIPIENT_TYPES,
      brandingAreas: BRANDING_AREA_KEYS,
      categories: PRODUCT_CATEGORY_L1_KEYS.map((l1) => ({
        l1,
        children: grouped.get(l1) ?? [],
      })),
    };
  }
}
