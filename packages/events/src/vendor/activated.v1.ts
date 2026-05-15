import { IsoDateTimeSchema, UlidSchema, z } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/vendor-service` when an admin clicks the
 * Approve button on the vendor-approval queue. Consumers: P7
 * product-service flips the vendor to "can list products"; P12
 * notification-service sends the "you're live!" email; analytics emits
 * `vendor activated` downstream.
 */
export const VendorActivatedV1 = defineEvent(
  'vendor.activated.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    approvedBy: UlidSchema,
    activatedAt: IsoDateTimeSchema,
  }),
);

export type VendorActivatedV1Payload = z.infer<typeof VendorActivatedV1.schema>['payload'];
