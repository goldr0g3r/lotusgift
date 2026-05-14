/**
 * Branded type primitive. Lets us mark a structurally identical type (e.g.
 * `string`) as semantically distinct (e.g. `UlidString`) so the compiler
 * refuses to swap one for the other at call sites.
 *
 * @example
 * ```ts
 * type UlidString = Brand<string, 'UlidString'>;
 * type OrgId = Brand<string, 'OrgId'>;
 *
 * const u: UlidString = '01H...' as UlidString;
 * const o: OrgId = u; // ❌ Type error — different brand
 * ```
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Strip the brand off a branded value, recovering the underlying primitive.
 * Use sparingly — most code should keep the branded type end-to-end.
 */
export function unbrand<T, B extends string>(value: Brand<T, B>): T {
  return value as T;
}
