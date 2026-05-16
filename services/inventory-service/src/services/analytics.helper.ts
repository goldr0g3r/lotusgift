import type { ServerAnalytics } from '@repo/analytics-sdk';

export const NO_OP_ANALYTICS: ServerAnalytics = {
  capture: () => {},
  identify: () => {},
  flush: async () => {},
  shutdown: async () => {},
};
