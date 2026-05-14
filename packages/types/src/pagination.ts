/**
 * Pagination + sort + filter primitives. Page-based by default (page +
 * limit); cursor-based pagination for high-cardinality lists (vendors,
 * orders) ships via `Cursor<T>` in P5+ services.
 *
 * Paired runtime schemas in `@repo/validators/pagination`.
 */

export type SortOrder = 'asc' | 'desc';

export interface PageMeta {
  /** 1-indexed page number. */
  readonly page: number;
  /** Items per page (max 100 per service-level cap). */
  readonly limit: number;
  /** Total matching items across all pages. */
  readonly total: number;
  /** Total pages available given `limit`. */
  readonly totalPages: number;
}

/**
 * Cursor for forward-only pagination on high-cardinality lists. The
 * cursor value is an opaque base64 string; consumers should not parse it.
 */
export interface Cursor<TKey extends string = string> {
  readonly value: string;
  readonly key?: TKey;
}

/**
 * Standard paginated response envelope. Service controllers wrap their
 * list responses in `Paginated<TItem>`.
 */
export interface Paginated<TItem> {
  readonly items: readonly TItem[];
  readonly pagination: PageMeta;
}

/**
 * Standard cursor-paginated response envelope.
 */
export interface CursorPaginated<TItem> {
  readonly items: readonly TItem[];
  /**
   * Cursor to fetch the next page; `null` when the current page is the
   * last one.
   */
  readonly nextCursor: Cursor | null;
}
