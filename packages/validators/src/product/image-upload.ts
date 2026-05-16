import { z } from '../zod.js';
import { IsoDateTimeSchema, R2ObjectKeySchema, UlidSchema, UrlSchema } from '../scalars.js';
import { ImageKindSchema } from './taxonomy.js';

/**
 * Two-step R2 image upload flow per D2 / Q1:
 *
 *   1. Client POSTs `ImageUploadUrlRequest` to
 *      `/api/products/:productId/images/upload-url`. Server returns
 *      a 15-min presigned R2 PUT URL + the assigned `r2Key`.
 *   2. Client PUTs the file bytes directly to R2 (saves the gateway
 *      from buffering ≤5 MB images).
 *   3. Client POSTs `ImageConfirmRequest` to
 *      `/api/products/:productId/images/confirm` with the `r2Key`.
 *      Server HEADs the object to verify the upload succeeded + the
 *      content-type + content-length match the presign constraints,
 *      then writes the `product.product_images` row + emits
 *      `product.image-confirmed.v1`.
 *
 * Content-type allow-list at presign time: `image/jpeg | image/png |
 * image/webp` (no SVG per D17 XSS surface; no AVIF per D17 Cloudflare
 * Images is the eventual transform target). Max file size: 5 MB.
 */

const ALLOWED_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const ImageContentTypeSchema = z.enum(ALLOWED_IMAGE_CONTENT_TYPES);

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Step 1 — request a presigned R2 PUT URL. The client declares the
 * intended `contentType` + `fileSize` so the presign embeds them as
 * signed headers (R2 will reject the PUT if the actual headers don't
 * match).
 */
export const ImageUploadUrlRequestSchema = z.object({
  contentType: ImageContentTypeSchema,
  fileSize: z
    .number()
    .int()
    .positive()
    .max(MAX_FILE_BYTES, `File size must be ≤${MAX_FILE_BYTES} bytes (5 MB)`),
  kind: ImageKindSchema.default('gallery'),
  altText: z.string().trim().max(160).optional(),
});

export const ImageUploadUrlResponseSchema = z.object({
  url: UrlSchema,
  r2Key: R2ObjectKeySchema,
  expiresAt: IsoDateTimeSchema,
  // Echo back the bound constraints so the client can verify before PUT.
  contentType: ImageContentTypeSchema,
  maxFileSize: z.number().int(),
});

/**
 * Step 3 — confirm a completed upload. The server HEADs `r2Key` and
 * validates the stored content-type + content-length match the
 * presigned constraints before persisting the image row.
 */
export const ImageConfirmRequestSchema = z.object({
  r2Key: R2ObjectKeySchema,
  kind: ImageKindSchema,
  altText: z.string().trim().max(160).optional(),
  sortOrder: z.number().int().min(0).max(100).default(0),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});

export const ImageResponseSchema = z.object({
  id: UlidSchema,
  productId: UlidSchema,
  r2Key: R2ObjectKeySchema,
  kind: ImageKindSchema,
  altText: z.string().nullable(),
  sortOrder: z.number().int(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  publicUrl: z.string().nullable(),
  confirmedAt: IsoDateTimeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ImageUploadUrlRequest = z.infer<typeof ImageUploadUrlRequestSchema>;
export type ImageUploadUrlResponse = z.infer<typeof ImageUploadUrlResponseSchema>;
export type ImageConfirmRequest = z.infer<typeof ImageConfirmRequestSchema>;
export type ImageResponse = z.infer<typeof ImageResponseSchema>;
