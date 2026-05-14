import { EnvSchema, type Env } from './env.schema.js';

/**
 * Error thrown when `loadEnv` fails validation. Aggregates every failing
 * Zod issue into a single error with a `cause` chain for debugging.
 */
export class ConfigValidationError extends Error {
  readonly issues: ReadonlyArray<{
    readonly path: string;
    readonly message: string;
    readonly code: string;
  }>;

  constructor(
    issues: ReadonlyArray<{ path: string; message: string; code: string }>,
    options?: { cause?: unknown },
  ) {
    const summary = issues.map((i) => `  - ${i.path}: ${i.message}`).join('\n');
    super(`Environment validation failed:\n${summary}`, options);
    this.name = 'ConfigValidationError';
    this.issues = issues;
  }
}

/**
 * Validate `process.env` against `EnvSchema` and return the typed `Env`.
 * Throws `ConfigValidationError` on any failed key — fail-fast at
 * bootstrap before the gateway accepts traffic.
 *
 * @example
 * ```ts
 * // apps/api-gateway/src/main.ts (P4)
 * import { loadEnv } from '@repo/config';
 *
 * const env = loadEnv(process.env);
 * ```
 */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join('.') || '(root)',
      message: i.message,
      code: i.code,
    }));
    throw new ConfigValidationError(issues, { cause: result.error });
  }
  return result.data;
}
