import { z, IsoDateTimeSchema, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryReorderNeededV1 = defineEvent(
  'inventory.reorder-needed.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    onHand: z.number().int().min(0),
    reorderPoint: z.number().int().min(0),
    suggestedOrderQty: z.number().int().min(1),
    detectedAt: IsoDateTimeSchema,
  }),
);
