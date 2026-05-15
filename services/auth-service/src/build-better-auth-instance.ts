import { Logger } from '@nestjs/common';
import type { MongoClient } from 'mongodb';

import type { Env } from '@repo/config';

import { buildBetterAuthOptions } from './auth.factory.js';
import { sendMsg91Otp } from './msg91.js';

const log = new Logger('BuildBetterAuth');

/**
 * Runtime shape of the Better-Auth instance returned by `betterAuth(...)`.
 *
 * We deliberately keep this loose (the full type is the plugin-intersected
 * super-union that Better-Auth derives from the options bag). Consumers
 * that need the typed `$Infer` shape can re-cast at their callsite — the
 * decorators in `decorators.ts` operate on `unknown` for the same reason.
 */
export interface BetterAuthInstance {
  handler: (request: Request) => Promise<Response>;
  api: {
    getSession: (input: { headers: Headers }) => Promise<unknown>;
  };
  $Infer?: unknown;
}

/**
 * Async factory that builds the Better-Auth instance.
 *
 * Why dynamic imports?
 *   `better-auth`, `better-auth/plugins`, `better-auth/adapters/mongodb`,
 *   and `@better-auth/passkey` are ALL ESM-only as of 1.6.11. The
 *   api-gateway and services/auth-service are both CJS-compiled
 *   (`module: Node16`). Using static `import` would fail at runtime
 *   under `require()` interop. The dynamic `await import(...)` pattern
 *   keeps the rest of the CJS stack untouched and is the officially
 *   recommended NestJS workaround for ESM-only deps (source: NestJS docs
 *   issue #3093, retrieved 2026-05-15).
 *
 * @see docs/research/phase-5b-auth-runtime.md — citations 1, 2, 5, 11.
 */
export async function buildBetterAuthInstance(
  env: Env,
  client: MongoClient,
): Promise<BetterAuthInstance> {
  const [
    { betterAuth },
    { admin, organization, twoFactor, phoneNumber },
    { mongodbAdapter },
    { passkey },
  ] = await Promise.all([
    import('better-auth'),
    import('better-auth/plugins'),
    import('better-auth/adapters/mongodb'),
    import('@better-auth/passkey'),
  ]);

  const baseOptions = buildBetterAuthOptions(env);

  const plugins = [
    admin({
      defaultRole: baseOptions.plugins.admin.defaultRole,
      adminRoles: baseOptions.plugins.admin.adminRoles,
    }),
    organization({
      allowUserToCreateOrganization: baseOptions.plugins.organization.allowUserToCreateOrganization,
      organizationLimit: baseOptions.plugins.organization.organizationLimit,
      membershipLimit: baseOptions.plugins.organization.membershipLimit,
      creatorRole: baseOptions.plugins.organization.creatorRole,
    }),
    passkey({
      rpID: rpIdFromUrl(env.BETTER_AUTH_URL),
      rpName: 'LotusGift',
    }),
    twoFactor({ issuer: 'LotusGift' }),
    phoneNumber({
      sendOTP: ({ phoneNumber: phone, code }: { phoneNumber: string; code: string }) => {
        // Fire-and-forget per Better-Auth's timing-attack mitigation guidance
        // (source: https://www.better-auth.com/docs/plugins/phone-number,
        // retrieved 2026-05-15). The promise is observed via .catch so an
        // MSG91 failure doesn't surface as an unhandled rejection.
        sendMsg91Otp(env, phone, code).catch((err: unknown) => {
          log.error(
            `sendMsg91Otp failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
      },
    }),
  ];

  const socialProviders: Record<string, unknown> = {};
  if (env.GOOGLE_OAUTH_CLIENT_ID && env.GOOGLE_OAUTH_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    };
  } else {
    log.warn(
      'GOOGLE_OAUTH_CLIENT_ID/SECRET unset — Google social provider not registered. Set both to enable.',
    );
  }

  // The plugin type intersection (admin + organization + passkey + twoFactor
  // + phoneNumber + Google) is un-expressible cleanly because each plugin
  // tightens different user-shape fields. We cast at the boundary per the
  // PR-14 `auth.factory.ts` precedent, then consumers work with `unknown`
  // via the @Session() / @CurrentUser() decorators.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instance = betterAuth({
    baseURL: baseOptions.baseURL,
    secret: baseOptions.secret,
    trustedOrigins: baseOptions.trustedOrigins,
    database: mongodbAdapter(client.db(), { client }),
    emailAndPassword: {
      enabled: baseOptions.emailAndPassword.enabled,
      minPasswordLength: baseOptions.emailAndPassword.minPasswordLength,
      requireEmailVerification: baseOptions.emailAndPassword.requireEmailVerification,
      // TODO(P12): replace these stubs with real Resend/Mailgun calls via
      // @repo/notification-service. For now we log so dev still sees the
      // signal in the console.
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        log.log(
          `[stub] sendResetPassword to ${user.email}: ${url} — wire real delivery at P12 notification-service.`,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        log.log(
          `[stub] sendVerificationEmail to ${user.email}: ${url} — wire real delivery at P12 notification-service.`,
        );
      },
    },
    session: baseOptions.session,
    advanced: baseOptions.advanced,
    socialProviders,
    plugins,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return instance as any as BetterAuthInstance;
}

/**
 * Derive the WebAuthn relying-party ID from `BETTER_AUTH_URL`.
 *
 * - `http://localhost:3001`  → `localhost`
 * - `https://api.lotusgift.com` → `api.lotusgift.com`
 *
 * Note for production: WebAuthn credentials are scoped to the rpID. If
 * the gateway runs at `api.lotusgift.com` but the frontend runs at
 * `www.lotusgift.com`, credentials won't roam. The cross-subdomain rpID
 * pinning is tracked in `docs/research/phase-5b-auth-runtime.md` Q5
 * (production-launch checklist item).
 */
function rpIdFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}
