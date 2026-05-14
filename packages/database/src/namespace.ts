/**
 * Collection-namespace helper per `.cursor/rules/deployment-mode.mdc`.
 *
 * Every service gets its own collection prefix so the single Mongo Atlas
 * M0 cluster (one cluster per project, see parent plan §9) hosts all 16
 * services without collection-name collisions. Examples:
 *
 *   namespace('order', 'orders')        -> 'order.orders'
 *   namespace('inventory', 'stock_ledger') -> 'inventory.stock_ledger'
 *   namespace('auth', 'session')        -> 'auth.session'
 *
 * The first argument is type-checked against the P2 16-service allow-list
 * to catch typos at the namespace boundary.
 */

export const SERVICE_NAMES = [
  'auth',
  'vendor',
  'product',
  'inventory',
  'customization',
  'rfq',
  'recipient-list',
  'order',
  'payment',
  'shipping',
  'notification',
  'tax',
  'promotions',
  'insights',
  'review',
  'support',
] as const;

export type ServiceName = (typeof SERVICE_NAMES)[number];

const SERVICE_NAME_SET = new Set<string>(SERVICE_NAMES);

/**
 * Compose a namespaced collection name `<service>.<entity>`.
 *
 * @throws if `service` is not in the 16-service allow-list, or `entity`
 *         is empty / whitespace / contains a `.` (would break namespacing).
 */
export function namespace(service: ServiceName, entity: string): string {
  if (!SERVICE_NAME_SET.has(service)) {
    throw new Error(
      `Unknown service "${service}". Must be one of: ${SERVICE_NAMES.join(', ')}.`,
    );
  }
  const trimmed = entity.trim();
  if (trimmed.length === 0) {
    throw new Error('Entity name cannot be empty or whitespace-only.');
  }
  if (trimmed.includes('.')) {
    throw new Error(
      `Entity name "${entity}" must not contain "." (reserved as namespace separator).`,
    );
  }
  return `${service}.${trimmed}`;
}
