import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

import { traceId as generateTraceId, withTraceId } from '@repo/utils';

const HEADER = 'x-trace-id';

/**
 * Per-request middleware that:
 *   1. Reads `X-Trace-Id` from the inbound request (or generates a new
 *      ULID-derived id if absent).
 *   2. Echoes the value back as `X-Trace-Id` on the response so callers
 *      can correlate.
 *   3. Opens an AsyncLocalStorage scope so downstream pino logger lines
 *      auto-inject `traceId` via the `createLogger` mixin from
 *      `@repo/utils`.
 *
 * Mount FIRST in the middleware chain so every other middleware /
 * controller call inherits the scope.
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const inbound = req.header(HEADER);
    const value = inbound && inbound.length > 0 ? inbound : generateTraceId();
    res.setHeader(HEADER, value);
    withTraceId(value, () => {
      next();
    });
  }
}
