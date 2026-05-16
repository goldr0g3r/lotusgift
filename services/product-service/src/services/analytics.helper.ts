import type { ServerAnalytics } from '@repo/analytics-sdk';

/**
 * No-op `ServerAnalytics` fallback. Used when the gateway doesn't pass
 * a configured PostHog client (dev / test environments where the
 * `POSTHOG_KEY` env var isn't set). Mirrors the
 * `services/vendor-service/src/services/analytics.helper.ts` (P6)
 * pattern.
 */
export const NO_OP_ANALYTICS: ServerAnalytics = {
  capture: () => {},
  identify: () => {},
  flush: async () => {},
  shutdown: async () => {},
};
