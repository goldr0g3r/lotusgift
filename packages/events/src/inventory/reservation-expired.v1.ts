import { z, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

export const InventoryReservationExpiredV1 = defineEvent(
  'inventory.reservation-expired.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    reservationId: UlidSchema,
    qty: z.number().int().positive(),
    idempotencyKey: z.string(),
  }),
);
