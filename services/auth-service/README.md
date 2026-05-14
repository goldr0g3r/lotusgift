# `@lotusgift/auth-service`

LotusGift v2's L4 auth service. PR-14 ships the **scaffold** (options builder + decorators + DI tokens + browser SDK). The actual `betterAuth(...)` call + Mongo adapter + AuthGuard + `toNodeHandler` mount land in **P5b** because Better-Auth is ESM-only and integrating it into the CJS-leaning api-gateway requires a deliberate interop pass (see the research note in `docs/research/phase-5-auth-service.md`).

## Shipped in PR-14

- `buildBetterAuthOptions(env)` — builds the Better-Auth options bag from `@repo/config.Env`. Consumers in P5b call `betterAuth(buildBetterAuthOptions(env))` themselves with the right interop.
- `BetterAuthOptions` type for the options bag.
- `OrgKind` type (`vendor-org` | `corporate-buyer-org` | `internal-staff-org`).
- `@AllowAnonymous()` + `@Session()` + `@CurrentUser()` decorators ready for controller consumption.
- `AUTH_INSTANCE` + `AUTH_MONGO_CLIENT` DI tokens.
- `ENV_TOKEN_NAME` re-export.
- Companion `@repo/auth-client` browser SDK — fully working.

## Defaults baked into the options bag

- Email/password enabled with 12-char minimum.
- Multi-session via `cookieCache: { enabled: true, maxAge: 5 * 60 }`.
- `cookieCache` 5-minute window for the gateway to skip Mongo reads on repeat requests within the same session.
- Cross-subdomain cookies enabled in production (`.lotusgift.com` derived from `FRONTEND_URL`).
- 3 org types declared via the Organization plugin (`vendor-org`, `corporate-buyer-org`, `internal-staff-org`).
- Admin plugin: `defaultRole: 'member'`, `adminRoles: ['admin']`, impersonation + ban methods exposed.

## Deferred to P5b

- Construct + register `betterAuth(...)` as a NestJS provider inside the api-gateway, with the right CJS↔ESM interop pattern.
- `AuthGuard` + `toNodeHandler` mount at `/api/auth/*` replacing the P4 stub controller.
- Passkey/WebAuthn (mandatory admin; optional vendor/corporate-buyer).
- 2FA TOTP + backup codes (mandatory admin/vendor; optional corporate-buyer/individual).
- Phone OTP via MSG91 (needs the MSG91 credentials + sender ID).
- Google social provider (needs the Google OAuth client ID + secret).
- Email verification + password reset (waiting on P12 email infra).
- KYC + credit-limit underwriting (P6 vendor-service + P10 payment-service).
- Cross-subdomain SSO Playwright test (P16).
- warehouse-manager + inventory-manager memberships scoped via vendor-org teams (P6).

## Controller consumption (works today)

```ts
import { AllowAnonymous, Session } from '@lotusgift/auth-service';

@Controller('orders')
export class OrdersController {
  @Get()
  list(@Session() session: unknown) {
    /* requires auth (once the global guard lands in P5b) */
  }

  @AllowAnonymous()
  @Get('public-catalog')
  publicCatalog() {
    /* opt-out of auth */
  }
}
```

## Building the options bag

```ts
import { buildBetterAuthOptions, ENV_TOKEN_NAME } from '@lotusgift/auth-service';
import { loadEnv } from '@repo/config';

const env = loadEnv(process.env);
const options = buildBetterAuthOptions(env);
// In P5b: await betterAuth(options) inside an async Nest provider
// with the appropriate ESM bridging at the consumer level.
```

## L4 placement

This package is L4 (`services/*`) per `.cursor/rules/architecture-layers.mdc`. Imports `@nestjs/common` (L0 npm) + `@repo/config` + `@repo/types` (L2 siblings). The decorator surface re-exported here lets controllers consume the auth ergonomics today; the actual Better-Auth runtime arrives at P5b.

## Browser side

`@repo/auth-client` (L3) wraps `better-auth/client` for the 4 Next.js apps. Plugins (organization + admin) pre-wired.
