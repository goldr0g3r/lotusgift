import { z, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryReservationExtendedV1 = defineEvent(
  'inventory.reservation-extended.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    reservationId: UlidSchema,
    newTtlSec: z.number().int().positive(),
    extensionCount: z.number().int().min(0),
  }),
);
