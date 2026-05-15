import { z, UlidSchema } from '@repo/validators';

import { defineEvent } from '../builders.js';

/**
 * Published by `services/vendor-service` when a user invokes the
 * onboarding wizard for the first time (creates a `DRAFT` vendor row +
 * binds the user's `vendor-org` Better-Auth Organization).
 *
 * Consumers: notification-service (P12) sends a "welcome — finish your
 * onboarding" email; analytics-sdk emits the `vendor onboarding-started`
 * event downstream (also fired directly by the service for PostHog).
 */
export const VendorOnboardingStartedV1 = defineEvent(
  'vendor.onboarding-started.v1',
  z.object({
    orgId: UlidSchema,
    vendorId: UlidSchema,
    startedBy: UlidSchema,
  }),
);

export type VendorOnboardingStartedV1Payload = z.infer<
  typeof VendorOnboardingStartedV1.schema
>['payload'];
