import { AsyncLocalStorage } from 'node:async_hooks';

import { ulid } from './ulid.js';

/**
 * Short correlation id. ULID-based so we get the same lexicographic
 * sorting + collision properties as entity IDs, prefixed with `trc_`
 * for grep-ability in logs.
 */
export function traceId(): string {
  return `trc_${ulid()}`;
}

/**
 * AsyncLocalStorage holding the active trace-id for the current async
 * scope. Consumers (gateway request middleware in P4) call
 * `withTraceId()` to enter a scope; downstream `currentTraceId()` reads
 * the active value or returns `undefined` when no scope is active.
 */
const traceStore = new AsyncLocalStorage<string>();

export function withTraceId<TResult>(id: string, fn: () => TResult): TResult {
  return traceStore.run(id, fn);
}

export function currentTraceId(): string | undefined {
  return traceStore.getStore();
}
