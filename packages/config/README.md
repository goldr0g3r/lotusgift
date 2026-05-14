# `@repo/config`

LotusGift v2's L2 environment-variable schema. Single source of truth for every env var the codebase reads per [`.cursor/rules/secrets-and-secrets-handling.mdc`](../../.cursor/rules/secrets-and-secrets-handling.mdc). Replaces the legacy Joi validator in `_old/apps/api/src/app.module.ts`.

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`env.schema.ts`](src/env.schema.ts) | `EnvSchema`, `Env` type | Adding a new env var (one place to update). |
| [`load-env.ts`](src/load-env.ts) | `loadEnv(source?)`, `ConfigValidationError` | Bootstrap — validate `process.env` once at startup before opening the HTTP socket. |

## Bootstrap recipe

```ts
// apps/api-gateway/src/main.ts (P4)
import { loadEnv, ConfigValidationError } from '@repo/config';

let env;
try {
  env = loadEnv(process.env);
} catch (err) {
  if (err instanceof ConfigValidationError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
```

`loadEnv` throws `ConfigValidationError` aggregating every failing key — log it once and exit with status 1. Don't let the process limp along with half-validated config.

## Adding a new env var

1. Add the key to [`env.schema.ts`](src/env.schema.ts) with the appropriate Zod validator (`z.string()`, `z.coerce.number()`, etc.) + default for dev.
2. Add the same key to [`.env.example`](../../.env.example) with an empty value.
3. Set the value in GitHub Environments (CI), Vercel (frontend), Oracle systemd `EnvironmentFile=` (backend VM) — in that order.
4. If the var is production-required, extend the `superRefine` block at the bottom of `env.schema.ts` to reject the dev sentinel value when `NODE_ENV === 'production'`.

Per the secrets-handling rule, the workspace gitignore covers `.env*` with the sole exception of `.env.example`.

## Production-required vs dev-default

Keys with a dev default but production requirement use a `superRefine` block at the bottom of `EnvSchema`:

- `BETTER_AUTH_SECRET` — dev sentinel `dev-secret-change-me-please-32ch+` rejected in prod.
- `MONGODB_URI` — `mongodb://localhost:27017/lotusgift` dev default rejected in prod.
- `BETTER_AUTH_URL` — `http://localhost:3001` dev default rejected in prod.
- `FRONTEND_URL` — `http://localhost:3000` dev default rejected in prod.
- `OTEL_EXPORTER_OTLP_ENDPOINT` — production-required (no dev default; OTEL is opt-in for `pnpm dev` via env var).

Mirrors the old Joi `.when('NODE_ENV', { is: 'production', then: required, otherwise: default })` semantics.

## L2 placement

Imports `zod` (L0 npm) + `@repo/validators` (L1 sibling for the `z` re-export). Does NOT import NestJS — the Nest `ConfigModule` wrapper lives in `apps/api-gateway` (P4) and consumes `loadEnv()`.
