import { createAuthClient } from 'better-auth/client';
import { organizationClient, adminClient } from 'better-auth/client/plugins';

export interface CreateLotusGiftAuthClientOptions {
  /** Base URL of the gateway, e.g. `https://api.lotusgift.com`. */
  baseURL: string;
}

/**
 * LotusGift v2 Better-Auth browser client. Wraps `createAuthClient`
 * with the organization + admin plugins pre-configured so consuming
 * apps (the 4 Next.js apps) don't have to re-declare the plugin list.
 *
 * Server-side: use `@lotusgift/auth-service` instead (it owns the
 * Better-Auth instance + Mongo adapter).
 */
export function createLotusGiftAuthClient(opts: CreateLotusGiftAuthClientOptions) {
  return createAuthClient({
    baseURL: opts.baseURL,
    plugins: [organizationClient(), adminClient()],
  });
}

export type LotusGiftAuthClient = ReturnType<typeof createLotusGiftAuthClient>;
