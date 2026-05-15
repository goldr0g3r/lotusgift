import { createAuthClient } from 'better-auth/client';
import { organizationClient, adminClient } from 'better-auth/client/plugins';

export interface CreateLotusGiftAuthClientOptions {
  /** Base URL of the gateway, e.g. `https://api.lotusgift.com`. */
  baseURL: string;
}

/**
 * Better-Auth client return type. Kept loose (`ReturnType<typeof createAuthClient<...>>`
 * would re-export the full plugin-intersected client type, which transitively
 * names a Zod-internal type and breaks `declarationMap` portability per
 * TS2742). Consumers cast to a more-specific shape at their callsite if
 * they need the typed `client.signIn.email()` / `client.organization.*`
 * surface.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LotusGiftAuthClient = any;

/**
 * LotusGift v2 Better-Auth browser client. Wraps `createAuthClient`
 * with the organization + admin plugins pre-configured so consuming
 * apps (the 4 Next.js apps) don't have to re-declare the plugin list.
 *
 * Server-side: use `@lotusgift/auth-service` instead (it owns the
 * Better-Auth instance + Mongo adapter).
 */
export function createLotusGiftAuthClient(opts: CreateLotusGiftAuthClientOptions): LotusGiftAuthClient {
  return createAuthClient({
    baseURL: opts.baseURL,
    plugins: [organizationClient(), adminClient()],
  });
}
