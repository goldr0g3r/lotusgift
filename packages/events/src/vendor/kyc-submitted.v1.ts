import {
  GstinIndiaSchema,
  PanEntityKindSchema,
  UlidSchema,
  z,
} from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/vendor-service` when the KYC wizard step
 * completes. Consumers: P10 payment-service subscribes to async-enrich
 * the submission via Razorpay's fund-account-validation API (see D23 /
 * Q2 answer in the phase-6 research note); P12 notification-service
 * sends a "KYC under review" email; P18 web-admin surfaces the
 * submission in the approval queue.
 *
 * `gstin` is included on the event payload so consumers don't have to
 * re-fetch — the PostHog wire path redacts it via @repo/utils.redact
 * before publication.
 */
export const VendorKycSubmittedV1 = defineEvent(
  'vendor.kyc-submitted.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    kycSubmissionId: UlidSchema,
    gstin: GstinIndiaSchema,
    panEntityKind: PanEntityKindSchema,
  }),
);

export type VendorKycSubmittedV1Payload = z.infer<typeof VendorKycSubmittedV1.schema>['payload'];
