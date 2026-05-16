/**
 * DI tokens consumed by product-service providers. Centralized here so
 * test-overrides + cross-service consumers reference the same constants
 * (mirrors `vendor-service.tokens.ts` from P6).
 */

/**
 * Typed `Env` provider — registered via `ProductServiceModule.forRoot(env)`
 * so the R2 client factory + analytics callsites can read configuration
 * without importing the gateway's `loadEnv()`.
 */
export const ENV_TOKEN = Symbol.for('@lotusgift/product-service#Env');

/**
 * `ServerAnalytics` provider (PostHog wrapper). Optional — when the
 * gateway doesn't configure `POSTHOG_KEY` we register a no-op stub so
 * service code doesn't need null-checks at every call-site.
 */
export const ANALYTICS_TOKEN = Symbol.for('@lotusgift/product-service#Analytics');

/**
 * R2 S3-compatible client provider — `@aws-sdk/client-s3.S3Client` bound
 * to the Cloudflare R2 endpoint. Tests substitute a stub returning
 * deterministic presigned URLs + HEAD responses.
 */
export const R2_CLIENT_TOKEN = Symbol.for('@lotusgift/product-service#R2Client');
