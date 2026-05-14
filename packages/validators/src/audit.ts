import { z } from './zod.js';
import { IsoDateTimeSchema, UlidSchema } from './scalars.js';

/**
 * Audit metadata embedded in every persisted entity. Paired with
 * `@repo/types/audit.AuditMeta`.
 *
 * Populated by the repository layer (P3 `@repo/database` middleware) —
 * domain code should not write to these fields directly.
 */
export const AuditMetaSchema = z.object({
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
  createdBy: z.union([UlidSchema, z.literal('system')]).optional(),
  updatedBy: z.union([UlidSchema, z.literal('system')]).optional(),
});
