import { z } from '../zod.js';
import { InrPaiseSchema, UlidSchema } from '../scalars.js';

/**
 * Single-level product variant. Per phase-7 D3 / Q2: variants live as
 * a Mongoose subdoc-array on the parent product (`product.products[variants]`),
 * with `attributes` as a free-form Map<string, string> capturing
 * arbitrary `{ color: 'Black', size: 'M' }` shapes without forcing
 * vendors into a fixed attribute taxonomy.
 *
 * Hard cap of 200 variants per product (D18) — variant.service throws
 * `VARIANT_LIMIT_EXCEEDED` above that; vendors split into multiple
 * SKUs.
 */

/**
 * Variant attributes — at least one key required (otherwise the variant
 * is indistinguishable from the parent product). Keys + values are
 * trimmed, 1-60 chars.
 */
const VARIANT_ATTR_KEY = z.string().trim().min(1).max(60);
const VARIANT_ATTR_VAL = z.string().trim().min(1).max(120);

export const VariantAttributesSchema = z
  .record(VARIANT_ATTR_KEY, VARIANT_ATTR_VAL)
  .refine(
    (m) => Object.keys(m).length >= 1,
    'At least one variant attribute required (e.g. { color, size })',
  )
  .refine((m) => Object.keys(m).length <= 12, 'At most 12 variant attributes per variant');

/**
 * Variant dimensions in millimeters — used by shipping-service (P11)
 * for volumetric-weight calculation.
 */
const DimensionsMmSchema = z.object({
  lengthMm: z.number().int().positive().max(2_000),
  widthMm: z.number().int().positive().max(2_000),
  heightMm: z.number().int().positive().max(2_000),
});

/**
 * Variant create-request payload. SKU is unique within a product
 * (validated by variant.service at write time, not Zod since uniqueness
 * is a Mongo constraint).
 */
export const VariantCreateRequestSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric or hyphen'),
  attributes: VariantAttributesSchema,
  pricePaise: InrPaiseSchema,
  weightGrams: z.number().int().min(1).max(50_000),
  dimensionsMm: DimensionsMmSchema,
  barcode: z.string().trim().min(8).max(40).optional(),
  enabled: z.boolean().default(true),
});

export const VariantUpdateRequestSchema = VariantCreateRequestSchema.partial();

export const VariantResponseSchema = z.object({
  id: UlidSchema,
  sku: z.string(),
  attributes: z.record(z.string(), z.string()),
  pricePaise: z.number().int().nonnegative(),
  weightGrams: z.number().int(),
  dimensionsMm: DimensionsMmSchema,
  barcode: z.string().optional(),
  enabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type VariantCreateRequest = z.infer<typeof VariantCreateRequestSchema>;
export type VariantUpdateRequest = z.infer<typeof VariantUpdateRequestSchema>;
export type VariantResponse = z.infer<typeof VariantResponseSchema>;
export type VariantAttributes = z.infer<typeof VariantAttributesSchema>;
