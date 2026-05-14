import type { ClientSession } from 'mongoose';

/**
 * Subscription handle returned by `OutboxPort.subscribe`. Call
 * `unsubscribe()` to remove the handler — typically wired to the host's
 * shutdown lifecycle (Nest `OnApplicationShutdown` in P4).
 */
export interface Subscription {
  unsubscribe(): void;
}

/**
 * Handler signature for a subscribed event. The relayer guarantees the
 * `__schemaVersion` envelope shape per `@repo/events/BaseEventEnvelopeSchema`;
 * consumers can `.parse()` against their event-specific schema to narrow
 * the payload type.
 */
export type OutboxEventHandler = (event: {
  type: string;
  payload: unknown;
  idempotencyKey: string;
  eventId: string;
  occurredAt: string;
}) => Promise<void> | void;

/**
 * Options accepted by `OutboxPort.publish`. The `session` MUST be the
 * same Mongoose `ClientSession` driving the domain write — that's the
 * whole point of the outbox pattern (atomic dual-write via single tx).
 */
export interface PublishOptions {
  session: ClientSession;
}

/**
 * Transport-agnostic outbox publisher + subscriber. Per
 * `.cursor/rules/event-driven-discipline.mdc`, every event is published
 * via this port from inside a Mongo transaction; no service code calls
 * `EventEmitter.emit()` directly.
 *
 * MVP implementation is `InProcessOutboxPort` (Mongo polling + node
 * EventEmitter). Production swap to Upstash Workflow + QStash happens
 * post-revenue per `docs/runbooks/scaling-up.md`.
 */
export interface OutboxPort {
  /**
   * Persist an event into the outbox collection. The relayer picks it
   * up on the next poll tick and emits to subscribers.
   *
   * Caller is responsible for ALSO writing the domain row inside the
   * same `opts.session` transaction — the outbox helper does NOT
   * touch domain collections.
   */
  publish(
    event: {
      readonly type: string;
      readonly payload: unknown;
      readonly idempotencyKey: string;
    },
    opts: PublishOptions,
  ): Promise<void>;

  /**
   * Subscribe to events with a matching `type` string. Multiple
   * subscribers per type are allowed; each receives every event once
   * (LRU dedup on `idempotencyKey` prevents double-delivery within the
   * dedup window).
   */
  subscribe(eventType: string, handler: OutboxEventHandler): Subscription;

  /**
   * Start the relayer poll loop. Call once at bootstrap (P4 wires this
   * into `OnApplicationBootstrap`).
   */
  start(): void;

  /**
   * Stop the poll loop + flush pending in-flight emissions. Awaitable
   * so callers can wire it into `OnApplicationShutdown`.
   */
  stop(): Promise<void>;
}

/**
 * DI token used by NestJS consumers to inject `OutboxPort`. The provider
 * registration lives in `apps/api-gateway` (P4); services request
 * `@Inject(OUTBOX_PORT) outbox: OutboxPort`.
 */
export const OUTBOX_PORT = Symbol.for('@repo/utils#OutboxPort');
