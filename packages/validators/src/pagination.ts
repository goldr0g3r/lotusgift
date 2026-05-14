import { z } from './zod.js';

/**
 * Page-based pagination query — accepted by every list endpoint. Max
 * `limit` is enforced at 100 to keep response sizes + DB load bounded;
 * services can lower the cap but should not raise it.
 */
export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const PageMetaSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

/**
 * Cursor for forward-only pagination on high-cardinality lists. Opaque
 * base64; consumers should pass it back verbatim.
 */
export const CursorSchema = z.object({
  value: z.string().min(1),
  key: z.string().optional(),
});

/**
 * Factory for the standard `Paginated<TItem>` response envelope.
 *
 * @example
 * const PaginatedProducts = PaginatedSchema(ProductSchema);
 */
export function PaginatedSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    pagination: PageMetaSchema,
  });
}

/**
 * Factory for the standard cursor-paginated response envelope.
 */
export function CursorPaginatedSchema<TItem extends z.ZodTypeAny>(itemSchema: TItem) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: CursorSchema.nullable(),
  });
}
