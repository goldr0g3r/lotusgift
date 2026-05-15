import { z } from '@repo/validators';

/**
 * LotusGift v2 env-var schema. Replaces the legacy Joi validator in
 * `_old/apps/api/src/app.module.ts`. Single source of truth per
 * `.cursor/rules/secrets-and-secrets-handling.mdc`.
 *
 * Variable lifecycle:
 *   1. Add a new key here (Zod schema).
 *   2. Set the value in GitHub Environments (CI).
 *   3. Mirror in Vercel Project Env Variables (frontend).
 *   4. Mirror in Oracle systemd `EnvironmentFile=` (backend VM).
 *
 * Production-required vs dev-default: keys flagged `requiredInProd` use
 * `superRefine` below so production fails fast on missing values while
 * dev still boots with localhost defaults.
 */

const NodeEnvSchema = z.enum(['development', 'test', 'production']).default('development');
const LogLevelSchema = z
  .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
  .default('info');

const baseEnv = z
  .object({
    // ---- Core runtime ----
    NODE_ENV: NodeEnvSchema,
    PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
    LOG_LEVEL: LogLevelSchema,

    // ---- MongoDB ----
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(\+srv)?:\/\//, 'Must be a mongodb:// or mongodb+srv:// URI')
      .default('mongodb://localhost:27017/lotusgift'),

    // ---- Better-Auth (P5) ----
    BETTER_AUTH_SECRET: z.string().min(16).default('dev-secret-change-me-please-32ch+'),
    BETTER_AUTH_URL: z.string().url().default('http://localhost:3001'),

    // ---- Frontend CORS allow-list (comma-separated) ----
    FRONTEND_URL: z.string().url().default('http://localhost:3000'),
    FRONTEND_URLS: z.string().optional(),

    // ---- Razorpay (P10) ----
    RAZORPAY_KEY_ID: z.string().optional(),
    RAZORPAY_KEY_SECRET: z.string().optional(),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

    // ---- SMTP / Resend (P12) ----
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65_535).optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().optional(),

    // ---- MSG91 phone OTP (P5b) — production callback for Better-Auth's
    // phoneNumber plugin. P12 notification-service migration replaces
    // the inline sendMsg91Otp helper.
    MSG91_AUTH_KEY: z.string().optional(),
    MSG91_TEMPLATE_ID: z.string().optional(),
    MSG91_SENDER_ID: z.string().optional(),

    // ---- Google OAuth (P5b) — Better-Auth socialProviders.google.
    // Plugin is gated by presence: missing => the social provider is
    // not registered at startup.
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),

    // ---- Upstash Redis (P4 rate-limit, P8 inventory reservations) ----
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

    // ---- Cloudflare R2 (P7 images, P8b customization art) ----
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_ENDPOINT: z.string().url().optional(),

    // ---- OpenTelemetry → Grafana Cloud (P3) ----
    OTEL_SERVICE_NAME: z.string().default('lotusgift-api'),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),

    // ---- Pino logger (P3) ----
    PINO_REDACT_FIELDS: z.string().optional(),

    // ---- OutboxPort relayer (P3) ----
    OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(50).max(60_000).default(250),

    // ---- OSM Nominatim (P6 vendor-service warehouse geocoding) ----
    // The OSM Foundation Nominatim instance enforces a 1 req/sec hard limit
    // and requires a User-Agent that identifies the application. We default
    // to the public OSM endpoint for dev convenience; in production we
    // expect a self-hosted Nominatim or MapMyIndia upgrade per
    // `docs/runbooks/scaling-up.md`.
    NOMINATIM_BASE_URL: z
      .string()
      .url()
      .default('https://nominatim.openstreetmap.org/search'),
    NOMINATIM_USER_AGENT: z.string().min(1).default('LotusGift-v2-Dev/0.1'),
    GEOCODE_CACHE_TTL_SECONDS: z.coerce.number().int().min(60).max(2_592_000).default(86_400),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;

    // Reject the dev-default sentinel values in production.
    if (env.BETTER_AUTH_SECRET === 'dev-secret-change-me-please-32ch+') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BETTER_AUTH_SECRET'],
        message: 'BETTER_AUTH_SECRET must be set to a non-default value in production',
      });
    }
    if (env.MONGODB_URI === 'mongodb://localhost:27017/lotusgift') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['MONGODB_URI'],
        message: 'MONGODB_URI must be set to a production cluster URI in production',
      });
    }
    if (env.BETTER_AUTH_URL === 'http://localhost:3001') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['BETTER_AUTH_URL'],
        message: 'BETTER_AUTH_URL must be set to a public https URL in production',
      });
    }
    if (env.FRONTEND_URL === 'http://localhost:3000') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FRONTEND_URL'],
        message: 'FRONTEND_URL must be set to a public https URL in production',
      });
    }
    if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['OTEL_EXPORTER_OTLP_ENDPOINT'],
        message:
          'OTEL_EXPORTER_OTLP_ENDPOINT must be set to the Grafana Cloud OTLP endpoint in production',
      });
    }
    if (env.NOMINATIM_USER_AGENT === 'LotusGift-v2-Dev/0.1') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['NOMINATIM_USER_AGENT'],
        message:
          'NOMINATIM_USER_AGENT must be set to a contact-identifying value in production per OSM policy (https://operations.osmfoundation.org/policies/nominatim/)',
      });
    }
  });

export const EnvSchema = baseEnv;
export type Env = z.infer<typeof EnvSchema>;
