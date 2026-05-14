# `@repo/utils`

LotusGift v2's L2 cross-cutting helpers. Ships ULID/trace-id generation, PII redaction, the pino logger factory, exponential-backoff retry, and the OutboxPort interface + in-process MVP implementation.

Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L2 imports L0–L1 + sibling L2. Framework-agnostic — runs in a Node worker, a NestJS app, or a Lambda.

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`ulid.ts`](src/ulid.ts) | `ulid()`, `decodeUlidTime(id)` | Generating domain IDs. Returns the `@repo/types/UlidString` brand. |
| [`trace-id.ts`](src/trace-id.ts) | `traceId()`, `withTraceId(id, fn)`, `currentTraceId()` | Correlation IDs propagated through AsyncLocalStorage. Gateway request middleware (P4) opens a scope per request. |
| [`redactor.ts`](src/redactor.ts) | `defaultRedactionPaths`, `pinoRedactionConfig(extras)`, `redact(input, paths)`, `defaultCensor()` | Building pino's `redact` option + ad-hoc PII scrubbing for analytics payloads (P3b). |
| [`pino-logger.ts`](src/pino-logger.ts) | `createLogger(opts)`, `CreateLoggerOptions` | Pino 9 logger with trace-id mixin + redaction + dev-pretty / prod-JSON transport. |
| [`retry.ts`](src/retry.ts) | `retry(fn, opts)`, `RetryOptions` | Wrapping flaky async calls — Mongo transactions, HTTP fetch, Razorpay API. Exponential backoff + full jitter + `AbortSignal`. |
| [`outbox-port.ts`](src/outbox-port.ts) | `OutboxPort` interface, `OUTBOX_PORT` DI symbol, `OutboxEventHandler`, `Subscription`, `PublishOptions` | The transport-agnostic publish + subscribe contract every service uses. |
| [`mongo-outbox-repository.ts`](src/mongo-outbox-repository.ts) | `MongoOutboxRepository` | Persistence layer for `outbox.events`. Used by the relayer; tests substitute a fake. |
| [`in-process-outbox.ts`](src/in-process-outbox.ts) | `InProcessOutboxPort`, `InProcessOutboxOptions` | The MVP relayer (Mongo poll + EventEmitter emit + LRU idempotency dedup). |

## OutboxPort recipe

### Publishing inside a transaction (service code, P5+)

```ts
import { withTransaction, getOutboxModel } from '@repo/database';
import { OUTBOX_PORT, ulid, type OutboxPort } from '@repo/utils';

@Injectable()
export class OrderService {
  constructor(
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @InjectConnection() private readonly db: Connection,
  ) {}

  async place(input: PlaceOrderRequest) {
    return withTransaction(this.db, async (session) => {
      const order = await Orders.create([{ id: ulid(), ...input }], { session });
      await this.outbox.publish(
        {
          type: 'order.placed.v1',
          payload: { orderId: order[0].id, totalPaise: input.totalPaise },
          idempotencyKey: `order:${order[0].id}:placed:1`,
        },
        { session },
      );
      return order[0];
    });
  }
}
```

### Subscribing (consumer service, P5+)

```ts
import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

@Injectable()
export class NotificationListener implements OnApplicationBootstrap {
  private subs: Array<{ unsubscribe(): void }> = [];

  constructor(@Inject(OUTBOX_PORT) private readonly outbox: OutboxPort) {}

  onApplicationBootstrap() {
    this.subs.push(
      this.outbox.subscribe('order.placed.v1', async (event) => {
        const parsed = OrderPlacedV1.schema.parse(event);
        await this.sendOrderConfirmation(parsed.payload);
      }),
    );
  }

  onApplicationShutdown() {
    this.subs.forEach((s) => s.unsubscribe());
  }
}
```

Gateway bootstrap (P4) wires the `InProcessOutboxPort` instance + binds it to `OUTBOX_PORT`:

```ts
// apps/api-gateway/src/app.module.ts (P4)
{
  provide: OUTBOX_PORT,
  useFactory: (db: Connection, logger: Logger) =>
    new InProcessOutboxPort(db, { log: (m, meta) => logger.info(meta, m) }),
  inject: [getConnectionToken(), Logger],
},
```

## Redactor

Default paths cover the highest-risk PII + secret fields. Service-specific extensions land per-service via the `LOG_REDACT_PATHS` env var:

| Category | Paths |
| --- | --- |
| Secrets | `password`, `token`, `secret`, `*.password`, `*.token`, `*.secret`, `authorization`, `cookie`, `req.headers.authorization`, `req.headers.cookie` |
| PII | `body.email`, `body.phone`, `body.gstin`, `body.pan`, `body.aadhaar`, `user.email`, `user.phone`, `recipient.email`, `recipient.phone` |

Use `pinoRedactionConfig(extras)` for `pino({ redact: ... })`. For ad-hoc scrubbing of analytics payloads, use `redact(obj, paths)`.

## Retry semantics

`retry(fn, opts)` runs `fn` up to `attempts` times with exponential backoff + **full jitter** (`Math.random() * Math.min(maxDelay, baseDelay * 2^attempt)`). Full jitter beats fixed-interval retries by spreading load when many clients hit the same upstream.

```ts
await retry(() => fetch(url), {
  attempts: 5,
  baseDelayMs: 200,
  maxDelayMs: 10_000,
  signal,
  shouldRetry: (err) => err instanceof NetworkError,
});
```

Honours `AbortSignal` between attempts; in-flight calls aren't cancelled (rely on the wrapped fn's own signal support).

## ULID

26-char Crockford base32. Lexicographically sortable (timestamp prefix), URL-safe, 128-bit-compatible with UUID. Generated via [`ulidx`](https://www.npmjs.com/package/ulidx). `decodeUlidTime` extracts the ms timestamp for sort-by-creation queries that don't need a separate `createdAt` index.

## L2 placement

Imports `pino`, `pino-pretty`, `ulidx`, `lru-cache`, `mongoose` (L0 npm) + `@repo/types`, `@repo/events`, `@repo/validators` (L1) + `@repo/database` (L2 sibling). Does NOT import NestJS — the DI binding lives in `apps/api-gateway` (P4).
