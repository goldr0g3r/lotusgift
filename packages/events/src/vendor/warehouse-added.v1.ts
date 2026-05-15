import {
  InStateCodeSchema,
  PincodeIndiaSchema,
  UlidSchema,
  z,
} from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/vendor-service` when a vendor adds a warehouse
 * (after Nominatim geocode + service-zone validation). Consumers: P8
 * inventory-service initializes per-warehouse stock ledger rows; P11
 * shipping-service primes per-warehouse pickup-OTP delivery slots;
 * analytics emits `warehouse added` downstream.
 */
export const VendorWarehouseAddedV1 = defineEvent(
  'vendor.warehouse-added.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    warehouseId: UlidSchema,
    state: InStateCodeSchema,
    pincode: PincodeIndiaSchema,
  }),
);

export type VendorWarehouseAddedV1Payload = z.infer<
  typeof VendorWarehouseAddedV1.schema
>['payload'];
