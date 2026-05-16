import { z, IsoDateTimeSchema, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryDeadStockDetectedV1 = defineEvent(
  'inventory.dead-stock-detected.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    onHand: z.number().int().min(0),
    daysSinceLastMovement: z.number().int().min(0),
    detectedAt: IsoDateTimeSchema,
  }),
);
