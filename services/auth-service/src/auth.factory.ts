import type { Env } from '@repo/config';

/**
 * Three LotusGift v2 org types per `.cursor/rules/corporate-gifting-domain.mdc`.
 * Used by the Organization plugin in P5b.
 */
export type OrgKind = 'vendor-org' | 'corporate-buyer-org' | 'internal-staff-org';

/**
 * Build the Better-Auth options bag for the LotusGift v2 gateway.
 *
 * **MVP scope (PR-14):** this PR ships the OPTIONS BUILDER + the
 * decorators + tokens + browser SDK only. The actual `betterAuth(...)`
 * call + Mongo adapter wiring + AuthGuard + `toNodeHandler` mount
 * land in P5b because:
 *
 *  - `better-auth` is an ESM-only package; integrating it into our
 *    CJS-leaning NestJS module (api-gateway) requires either ESM-ifying
 *    the gateway (cascade through Mongoose + Pino + Helmet) or using
 *    Better-Auth's CommonJS build path which is not officially
 *    supported on every plugin.
 *  - The admin + organization plugin types' user-shape intersection
 *    isn't expressible without dropping to `any` or wrapping every
 *    callsite — the user comes back to pick the right interop pattern.
 *
 * For now consumers can:
 *
 *  - Import this factory and `betterAuth(options)` themselves with the
 *    appropriate ESM bridging at the consumer level.
 *  - Use the `@AllowAnonymous` / `@Session` / `@CurrentUser` decorators
 *    + `AUTH_INSTANCE` token from this package.
 *  - Use the `@repo/auth-client` browser SDK directly — that side is
 *    pure ESM and already wired.
 */
export function buildBetterAuthOptions(env: Env): BetterAuthOptions {
  const trustedOrigins = [env.FRONTEND_URL, ...(env.FRONTEND_URLS ?? '').split(',')]
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return {
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      crossSubDomainCookies:
        env.NODE_ENV === 'production'
          ? {
              enabled: true,
              domain: extractRootDomain(env.FRONTEND_URL),
            }
          : { enabled: false },
    },
    plugins: {
      admin: { defaultRole: 'member', adminRoles: ['admin'] },
      organization: {
        allowUserToCreateOrganization: true,
        organizationLimit: 5,
        membershipLimit: 100,
        creatorRole: 'owner',
      },
    },
  };
}

/**
 * Shape of the options bag `buildBetterAuthOptions` returns. The
 * consumer constructs `betterAuth(options)` itself with the real
 * Better-Auth call to keep the ESM-only import out of this module.
 */
export interface BetterAuthOptions {
  baseURL: string;
  secret: string;
  trustedOrigins: string[];
  emailAndPassword: {
    enabled: boolean;
    minPasswordLength: number;
    requireEmailVerification: boolean;
  };
  session: {
    expiresIn: number;
    updateAge: number;
    cookieCache: { enabled: boolean; maxAge: number };
  };
  advanced: {
    crossSubDomainCookies:
      | { enabled: true; domain: string | undefined }
      | { enabled: false };
  };
  plugins: {
    admin: { defaultRole: string; adminRoles: string[] };
    organization: {
      allowUserToCreateOrganization: boolean;
      organizationLimit: number;
      membershipLimit: number;
      creatorRole: string;
    };
  };
}

function extractRootDomain(url: string): string | undefined {
  try {
    const u = new URL(url);
    const parts = u.hostname.split('.');
    if (parts.length < 2) return undefined;
    return `.${parts.slice(-2).join('.')}`;
  } catch {
    return undefined;
  }
}
