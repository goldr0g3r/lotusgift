# `@repo/types`

LotusGift v2's L1 type-only package. Holds branded scalar primitives, shared enums, pagination/audit metadata. **No runtime exports** — every symbol is `export type` so consumers pay zero bundle cost.

Paired runtime Zod schemas live in [`@repo/validators`](../validators/) and use the same brand identifiers, so passing a `UlidSchema.parse(input)` result to a function expecting `UlidString` type-checks for free.

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`brand.ts`](src/brand.ts) | `Brand<T, B>`, `unbrand()` | Defining a new branded scalar. Don't import directly — re-export via `index.ts`. |
| [`scalars.ts`](src/scalars.ts) | `UlidString`, `InrPaise`, `GstinIndia`, `PhoneIndiaE164`, `PincodeIndia`, `IsoDateString`, `IsoDateTimeString`, `EmailLowercase`, `UrlString`, `R2ObjectKey` | Annotating function parameters, entity fields, event payloads. |
| [`enums.ts`](src/enums.ts) | `OrgKind`, `UserRole`, `OrderStatus`, `ShipmentStatus`, `PaymentStatus`, `RfqStatus`, `CustomizationStatus`, `RecipientListUploadStatus` | Domain status fields. Runtime parsers in `@repo/validators/enums`. |
| [`pagination.ts`](src/pagination.ts) | `PageMeta`, `SortOrder`, `Cursor<T>`, `Paginated<TItem>`, `CursorPaginated<TItem>` | List-response envelopes; service controllers wrap arrays in these. |
| [`audit.ts`](src/audit.ts) | `AuditMeta` | Embedded `createdAt`/`updatedAt`/`createdBy`/`updatedBy` on every persisted entity. |

## Branded type pattern

A branded type is a structural primitive (e.g. `string`) tagged with a phantom property so the compiler treats it as nominal:

```ts
import type { Brand } from '@repo/types';

type OrderId = Brand<string, 'OrderId'>;
type CustomerId = Brand<string, 'CustomerId'>;

function loadOrder(id: OrderId) { /* … */ }

const cid: CustomerId = 'cust_123' as CustomerId;
loadOrder(cid); // ❌ Type error — different brand
```

Use `unbrand()` only at I/O boundaries (serialization, logging). Domain code should keep the branded type end-to-end.

## INR is in paise

`InrPaise` is a **non-negative integer** representing the amount in 1/100ths of a rupee:

```ts
import type { InrPaise } from '@repo/types';

const oneRupee: InrPaise = 100 as InrPaise;
const oneCrore: InrPaise = 1_000_000_000 as InrPaise; // ₹1,00,00,000
```

This matches Razorpay's wire format and avoids floating-point math errors. Display formatting (e.g. `₹1,234.56`) is a presentation concern handled by `@repo/utils/format-inr` (P3).

## Adding a new scalar

1. Add the `Brand<T, B>` type alias to [`src/scalars.ts`](src/scalars.ts) with JSDoc explaining the wire format + regex.
2. Re-export from [`src/index.ts`](src/index.ts).
3. Add the paired Zod schema to `packages/validators/src/scalars.ts` using the same brand identifier.
4. Add a row to this README's module map.
5. Add unit tests for the schema's happy + failure paths in `packages/validators/src/scalars.test.ts`.

## L1 placement (no runtime deps)

This package has zero runtime dependencies. Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L1 packages import from L0 only. Future enums or scalars that need runtime values belong in `@repo/validators` (which itself only imports from `@repo/types` + `zod`).
