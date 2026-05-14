# `@repo/database`

LotusGift v2's L2 Mongoose 8 platform package. Holds the connection factory, collection-namespace helper, base-schema plugin (ULID `id` + audit fields), `outbox.events` schema, and `withTransaction` wrapper.

Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L2 packages import from L0–L1 only. This package wraps raw Mongoose 8 — the `@nestjs/mongoose` adapter is an L4 wrapper that lives in `apps/api-gateway` (P4).

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`connection.ts`](src/connection.ts) | `createMongoConnection(uri, opts)`, `closeAllConnections()`, `CreateConnectionOptions` | Opening (or reusing) a Mongoose connection at bootstrap. Singleton-per-URI within the process. |
| [`namespace.ts`](src/namespace.ts) | `namespace(service, entity)`, `SERVICE_NAMES`, `ServiceName` | Composing `<service>.<entity>` collection names with the 16-service allow-list guard. |
| [`base-schema.ts`](src/base-schema.ts) | `baseSchemaPlugin` | `schema.plugin(baseSchemaPlugin)` on every domain schema — adds `id: UlidString` + `createdBy` / `updatedBy` audit fields. |
| [`outbox-collection.ts`](src/outbox-collection.ts) | `getOutboxModel(connection)`, `OUTBOX_COLLECTION_NAME`, `OutboxDoc` | The `outbox.events` collection consumed by `@repo/utils/InProcessOutboxPort`. |
| [`transactions.ts`](src/transactions.ts) | `withTransaction(connection, async (session) => { ... })` | Atomic multi-document writes (e.g., domain row + outbox row). Auto-handles commit, abort, and retry on transient transaction errors per Mongoose 8 docs. |

## Connection lifecycle

```ts
import { createMongoConnection } from '@repo/database';
import { loadEnv } from '@repo/config';

const env = loadEnv(process.env);
const db = createMongoConnection(env.MONGODB_URI, {
  autoIndex: env.NODE_ENV !== 'production',
});

// Graceful shutdown (api-gateway OnApplicationShutdown — P4):
await db.close();
```

Singleton-per-URI semantics: calling `createMongoConnection(uri)` twice with the same URI returns the same `Connection` (no pool leak). Call `closeAllConnections()` at process exit in test bootstraps.

## Collection-namespace pattern

Per [`.cursor/rules/deployment-mode.mdc`](../../.cursor/rules/deployment-mode.mdc), every domain collection is named `<service>.<entity>`:

```ts
import { namespace } from '@repo/database';

const COLLECTION = namespace('order', 'orders');         // 'order.orders'
const STOCK = namespace('inventory', 'stock_ledger');    // 'inventory.stock_ledger'
const QUOTE = namespace('rfq', 'quotes');                // 'rfq.quotes'
```

The `service` argument is type-checked against the 16-service P2 allow-list (`auth`, `vendor`, `product`, `inventory`, `customization`, `rfq`, `recipient-list`, `order`, `payment`, `shipping`, `notification`, `tax`, `promotions`, `insights`, `review`, `support`). Pass a string not in the list and TypeScript errors at compile + the runtime check throws.

`outbox.events` (synthetic, not in the service allow-list) is the one exception and lives as `OUTBOX_COLLECTION_NAME`.

## Base-schema plugin

Every domain schema MUST register this plugin so consumers can rely on consistent shape:

```ts
import { Schema } from 'mongoose';
import { baseSchemaPlugin } from '@repo/database';

const orderSchema = new Schema({ /* ... */ }, { timestamps: true });
orderSchema.plugin(baseSchemaPlugin);
```

Adds:

- `id` — domain-level ULID (separate from `_id: ObjectId`). Service-side ULID generation lives in [`@repo/utils/ulid`](../utils/src/ulid.ts).
- `createdBy` / `updatedBy` — optional `UlidString | 'system'` markers populated by the repository layer.

`createdAt` / `updatedAt` come from Mongoose's `timestamps: true` — opt in per-collection (we don't force it because some lookup collections legitimately don't need them).

## OutboxPort wiring

```ts
import { withTransaction, getOutboxModel } from '@repo/database';
import { ulid } from '@repo/utils';

await withTransaction(db, async (session) => {
  const order = await Orders.create([{ /* ... */ }], { session });
  await getOutboxModel(db).create(
    [{
      _id: ulid(),
      eventType: 'order.placed.v1',
      payload: { orderId: order[0].id, totalPaise: 100_000 },
      status: 'pending',
      attemptCount: 0,
      idempotencyKey: `order:${order[0].id}:placed:1`,
    }],
    { session },
  );
});
```

The actual `OutboxPort` interface + relayer (`InProcessOutboxPort`) live in [`@repo/utils`](../utils/) — this package only owns the schema + connection contract.

## L2 placement

Imports from `mongoose` (L0 npm) + `@repo/types`, `@repo/validators`, `@repo/events` (L1 siblings). Does NOT import NestJS, observability, or higher-layer packages.
