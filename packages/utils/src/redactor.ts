/**
 * Default redaction paths covering the highest-risk PII + secret fields
 * across the LotusGift v2 service surface. Per
 * `.cursor/rules/secrets-and-secrets-handling.mdc`, never log a secret;
 * per analytics-instrumentation rule, never funnel PII through PostHog
 * without redacting first.
 *
 * Path syntax matches pino's `redact.paths` per pino docs (cite #8 in
 * the P3 research note). Explicit paths are preferred over wildcards —
 * wildcards carry ~50% overhead per the same source.
 *
 * Service-specific additions land per-service in P5+ via the
 * `LOG_REDACT_PATHS` env var (comma-separated extension list).
 */
export const defaultRedactionPaths: readonly string[] = [
  // Secrets
  'password',
  'token',
  'secret',
  '*.password',
  '*.token',
  '*.secret',
  'authorization',
  'cookie',
  'req.headers.authorization',
  'req.headers.cookie',
  'request.headers.authorization',
  'request.headers.cookie',
  // PII
  'body.email',
  'body.phone',
  'body.gstin',
  'body.pan',
  'body.aadhaar',
  'user.email',
  'user.phone',
  'recipient.email',
  'recipient.phone',
];

const REDACTED = '[REDACTED]' as const;

/**
 * Returns the censor value pino's `redact` option uses for matched
 * fields. Configurable so consumers can substitute a hash or marker.
 */
export function defaultCensor(): string {
  return REDACTED;
}

/**
 * Build a pino-compatible `redact` config object. Equivalent to:
 *
 *   pino({ redact: { paths: [...], censor: '[REDACTED]' } })
 */
export function pinoRedactionConfig(extraPaths: readonly string[] = []): {
  paths: string[];
  censor: string;
  remove: boolean;
} {
  return {
    paths: [...defaultRedactionPaths, ...extraPaths],
    censor: REDACTED,
    remove: false,
  };
}

/**
 * Deep-clone-redact a plain object at the given paths. Mostly used by
 * the analytics-sdk wrapper (P3b) before forwarding event payloads to
 * PostHog; the request/response logger relies on pino's built-in path
 * redaction instead.
 *
 * Handles dot-notation paths only (`req.headers.authorization`); not
 * wildcard paths (use pino's redact for those).
 */
export function redact<T>(input: T, paths: readonly string[] = defaultRedactionPaths): T {
  if (input === null || typeof input !== 'object') {
    return input;
  }
  const clone: unknown = JSON.parse(JSON.stringify(input));
  for (const path of paths) {
    if (path.includes('*')) continue; // wildcards handled by pino, skip here
    setAtPath(clone as Record<string, unknown>, path.split('.'), REDACTED);
  }
  return clone as T;
}

function setAtPath(
  target: Record<string, unknown>,
  segments: readonly string[],
  value: string,
): void {
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < segments.length - 1; i++) {
    const next = cursor[segments[i] as string];
    if (next === null || typeof next !== 'object') return;
    cursor = next as Record<string, unknown>;
  }
  const last = segments[segments.length - 1] as string;
  if (last in cursor) {
    cursor[last] = value;
  }
}
