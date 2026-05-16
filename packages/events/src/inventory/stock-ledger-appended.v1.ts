import { z, UlidSchema } from '@repo/validators';
import { STOCK_LEDGER_REASONS } from '@repo/types';

import { defineEvent } from '../builders.js';

export const InventoryStockLedgerAppendedV1 = defineEvent(
  'inventory.stock-ledger-appended.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    variantId: UlidSchema,
    ledgerEntryId: UlidSchema,
    delta: z.number().int(),
    reason: z.enum(STOCK_LEDGER_REASONS),
    newOnHand: z.number().int().min(0),
  }),
);

export type InventoryStockLedgerAppendedV1Payload = z.infer<
  typeof InventoryStockLedgerAppendedV1.schema
>['payload'];
