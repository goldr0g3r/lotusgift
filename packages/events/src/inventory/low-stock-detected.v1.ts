import { z, IsoDateTimeSchema, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryLowStockDetectedV1 = defineEvent(
  'inventory.low-stock-detected.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    onHand: z.number().int().min(0),
    threshold: z.number().int().min(0),
    detectedAt: IsoDateTimeSchema,
  }),
);
