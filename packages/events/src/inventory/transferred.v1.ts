import { z, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryTransferredV1 = defineEvent(
  'inventory.transferred.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    fromWarehouseId: UlidSchema,
    toWarehouseId: UlidSchema,
    variantId: UlidSchema,
    qty: z.number().int().positive(),
    transferId: UlidSchema,
    reasonNote: z.string(),
  }),
);
