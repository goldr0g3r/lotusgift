import pino, { type Logger, type LoggerOptions } from 'pino';

import { pinoRedactionConfig } from './redactor.js';
import { currentTraceId } from './trace-id.js';

export interface CreateLoggerOptions {
  /** Log level. Defaults to `info`. */
  level?: LoggerOptions['level'];
  /** `service.name` resource attribute. Defaults to `lotusgift-api`. */
  service?: string;
  /**
   * Extra pino redaction paths to merge with the defaults from
   * `redactor.ts`. Production should always pull this from the
   * `PINO_REDACT_FIELDS` env var (comma-separated).
   */
  extraRedactPaths?: readonly string[];
  /**
   * Pretty-print transport when `true`. Defaults to enabled when
   * `NODE_ENV !== 'production'`.
   */
  pretty?: boolean;
}

/**
 * Build a configured pino logger. Always:
 * - Injects the active trace-id (from AsyncLocalStorage) as a
 *   per-log property via `mixin`.
 * - Applies the default redaction path list + the per-call extras.
 * - Uses `pino-pretty` transport in dev, raw JSON in prod.
 */
export function createLogger(opts: CreateLoggerOptions = {}): Logger {
  const service = opts.service ?? 'lotusgift-api';
  const pretty = opts.pretty ?? process.env.NODE_ENV !== 'production';

  const baseOptions: LoggerOptions = {
    level: opts.level ?? 'info',
    base: { service },
    redact: pinoRedactionConfig(opts.extraRedactPaths ?? []),
    mixin: () => {
      const trace = currentTraceId();
      return trace ? { traceId: trace } : {};
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (pretty) {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: false,
          ignore: 'pid,hostname',
        },
      },
    });
  }

  return pino(baseOptions);
}
