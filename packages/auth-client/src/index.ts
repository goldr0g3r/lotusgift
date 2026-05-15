import { createAuthClient } from 'better-auth/client';
import {
  organizationClient,
  adminClient,
  twoFactorClient,
  phoneNumberClient,
} from 'better-auth/client/plugins';
import { passkeyClient } from '@better-auth/passkey/client';

export interface CreateLotusGiftAuthClientOptions {
  /** Base URL of the gateway, e.g. `https://api.lotusgift.com`. */
  baseURL: string;
}

/**
 * Project-owned interface for the supported LotusGift auth surface.
 * Mirrors the runtime API of `createAuthClient({ plugins: [...] })`
 * with only the methods we actually expose to consuming apps. The
 * full Better-Auth-inferred client type isn't portable across
 * package boundaries (it references Zod-internal symbols via
 * `declarationMap`, breaking with TS2742) — this hand-written shape
 * keeps consumer type-checking honest without leaking framework
 * internals.
 *
 * If/when consumers need an additional Better-Auth method, ADD IT
 * HERE first so we have a single source of truth for the SDK
 * surface (and so static-analysis catches consumers that drift).
 */
export interface LotusGiftAuthClient {
  /**
   * Email + password flows (built-in Better-Auth).
   *
   * Note: `signUp.email` triggers an email verification when
   * `emailVerification.sendOnSignUp` is enabled server-side
   * (it is, per `services/auth-service`).
   */
  signUp: {
    email: (input: {
      email: string;
      password: string;
      name?: string;
    }) => Promise<{ data: unknown; error: unknown }>;
  };
  signIn: {
    email: (input: {
      email: string;
      password: string;
    }) => Promise<{ data: unknown; error: unknown }>;
    /** Google social provider sign-in. */
    social: (input: {
      provider: 'google';
      callbackURL?: string;
    }) => Promise<{ data: unknown; error: unknown }>;
    /** WebAuthn / passkey sign-in (`@better-auth/passkey` plugin). */
    passkey: () => Promise<{ data: unknown; error: unknown }>;
  };
  signOut: () => Promise<{ data: unknown; error: unknown }>;
  getSession: () => Promise<{ data: unknown; error: unknown }>;

  /** `organization` plugin — multi-org membership. */
  organization: Record<string, unknown>;

  /** `admin` plugin — admin user management (impersonate, listUsers, etc). */
  admin: Record<string, unknown>;

  /** `passkey` plugin — add / list / delete WebAuthn credentials. */
  passkey: Record<string, unknown>;

  /** `twoFactor` plugin — enable / verify TOTP + backup codes. */
  twoFactor: Record<string, unknown>;

  /** `phoneNumber` plugin — send-OTP + verify-OTP via MSG91. */
  phoneNumber: Record<string, unknown>;

  /** Cookie-cache flag exposed by Better-Auth's client. */
  $store?: unknown;
}

/**
 * LotusGift v2 Better-Auth browser client. Wraps `createAuthClient`
 * with the organization + admin + passkey + twoFactor + phoneNumber
 * client plugins pre-configured so consuming apps (the 4 Next.js apps)
 * don't have to re-declare the plugin list.
 *
 * Server-side: use `@lotusgift/auth-service` instead (it owns the
 * Better-Auth instance + Mongo adapter).
 */
export function createLotusGiftAuthClient(
  opts: CreateLotusGiftAuthClientOptions,
): LotusGiftAuthClient {
  const client = createAuthClient({
    baseURL: opts.baseURL,
    plugins: [
      organizationClient(),
      adminClient(),
      passkeyClient(),
      twoFactorClient(),
      phoneNumberClient(),
    ],
  });
  return client as unknown as LotusGiftAuthClient;
}
