/**
 * DI tokens consumed by vendor-service providers. Centralized here so
 * test-overrides + cross-service consumers reference the same constants
 * (matches the auth-service `auth.tokens.ts` convention).
 */

/**
 * Typed `Env` provider — registered via `VendorServiceModule.forRoot(env)`
 * so the geocoder + analytics callsites can read configuration without
 * importing the gateway's `loadEnv()`.
 */
export const ENV_TOKEN = Symbol.for('@lotusgift/vendor-service#Env');

/**
 * `ServerAnalytics` provider (PostHog wrapper). Optional — when the
 * gateway doesn't configure `POSTHOG_KEY` we register a no-op stub so
 * service code doesn't need null-checks at every call-site.
 */
export const ANALYTICS_TOKEN = Symbol.for('@lotusgift/vendor-service#Analytics');

/**
 * Fetch-shape token for the geocoder. Defaults to the global `fetch`
 * but test modules substitute a stub.
 */
export const GEOCODER_FETCH_TOKEN = 'GEOCODER_FETCH' as const;
