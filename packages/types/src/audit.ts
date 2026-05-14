import type { IsoDateTimeString, UlidString } from './scalars.js';

/**
 * Audit metadata embedded in every persisted entity. Populated by the
 * repository layer (P3 `@repo/database` middleware); domain code should
 * not write to these fields directly.
 */
export interface AuditMeta {
  readonly createdAt: IsoDateTimeString;
  readonly updatedAt: IsoDateTimeString;
  /**
   * ULID of the user (or `'system'` for system-emitted writes) that
   * created the entity. `undefined` only on migrations from legacy data.
   */
  readonly createdBy?: UlidString | 'system';
  readonly updatedBy?: UlidString | 'system';
}
