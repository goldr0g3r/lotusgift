import {
  BRANDING_AREA_KEYS,
  IMAGE_KIND_KEYS,
  PRODUCT_CATEGORY_L1_KEYS,
  PRODUCT_CATEGORY_L2_KEYS,
  PRODUCT_OCCASIONS,
  PRODUCT_STATUS_KEYS,
  RECIPIENT_TYPES,
  REVIEW_STATUS_KEYS,
} from '@repo/types';

import { z } from '../zod.js';

/**
 * Zod parsers paired with the corresponding const-array exports in
 * `@repo/types/product`. Keeps the type-level + runtime sets in lockstep
 * (per phase-7 D4 + the india.ts pattern).
 */

export const ProductOccasionSchema = z.enum(PRODUCT_OCCASIONS);
export const RecipientTypeSchema = z.enum(RECIPIENT_TYPES);
export const ProductStatusSchema = z.enum(PRODUCT_STATUS_KEYS);
export const ProductCategoryL1Schema = z.enum(PRODUCT_CATEGORY_L1_KEYS);
export const ProductCategoryL2Schema = z.enum(PRODUCT_CATEGORY_L2_KEYS);
export const BrandingAreaSchema = z.enum(BRANDING_AREA_KEYS);
export const ImageKindSchema = z.enum(IMAGE_KIND_KEYS);
export const ReviewStatusSchema = z.enum(REVIEW_STATUS_KEYS);
