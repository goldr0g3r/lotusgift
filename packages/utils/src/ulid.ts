import { ulid as generateUlid, decodeTime } from 'ulidx';

import type { UlidString } from '@repo/types';

/**
 * Generate a 26-char Crockford base32 ULID. The return type is the
 * `@repo/types/UlidString` brand so callers can pass the value to
 * functions expecting branded IDs without an explicit cast.
 *
 * @see https://github.com/ulid/spec
 */
export function ulid(): UlidString {
  return generateUlid() as UlidString;
}

/**
 * Extract the millisecond timestamp embedded in a ULID. Lets consumers
 * sort or window by creation time without storing a separate
 * `createdAt` field for the lookup path.
 */
export function decodeUlidTime(id: UlidString): number {
  return decodeTime(id);
}
