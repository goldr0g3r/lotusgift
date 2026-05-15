import {
  CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { IncomingHttpHeaders } from 'node:http';

import { ALLOW_ANONYMOUS_KEY } from './decorators.js';
import { AUTH_INSTANCE } from './auth.tokens.js';
import type { BetterAuthInstance } from './build-better-auth-instance.js';

interface RequestLike {
  headers: IncomingHttpHeaders;
  session?: unknown;
  user?: unknown;
}

/**
 * Global AuthGuard for the api-gateway. Default-deny: every endpoint
 * requires a session unless the handler / controller is decorated with
 * `@AllowAnonymous()`.
 *
 * Reads the Better-Auth session via `auth.api.getSession({ headers })`.
 * The `headers` argument is a Web Fetch `Headers` instance — Node's
 * Express `req.headers` is an `IncomingHttpHeaders` (a plain object),
 * so we adapt via the inline `nodeHeadersToFetchHeaders()` helper.
 *
 * Why the inline helper instead of `fromNodeHeaders` from
 * `better-auth/node`? `better-auth/node` is ESM-only and this guard
 * file is CJS — dynamically importing it inside `canActivate()` would
 * add ~5ms of overhead per request. The helper is a 6-line iteration
 * over `req.headers` that's a no-op cost.
 *
 * On failure throws `UnauthorizedException({ message, code: 'AUTH_INVALID_TOKEN' })`
 * so the `GlobalProblemDetailsFilter` renders an RFC 9457 envelope with
 * the canonical LotusGift error code.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(AUTH_INSTANCE) private readonly auth: BetterAuthInstance,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAnonymous = this.reflector.getAllAndOverride<boolean>(ALLOW_ANONYMOUS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isAnonymous) return true;

    const request = context.switchToHttp().getRequest<RequestLike>();
    const result = (await this.auth.api.getSession({
      headers: nodeHeadersToFetchHeaders(request.headers),
    })) as { session?: unknown; user?: unknown } | null;

    if (!result || !result.session || !result.user) {
      throw new UnauthorizedException({
        message: 'Authentication required',
        code: 'AUTH_INVALID_TOKEN',
      });
    }

    request.session = result.session;
    request.user = result.user;
    return true;
  }
}

/**
 * Convert Node's `IncomingHttpHeaders` (a plain object that may carry
 * string OR string[] values per RFC 7230 "comma-separated allowed"
 * conventions) into a Web Fetch `Headers` instance.
 *
 * Mirrors the behaviour of `better-auth/node`'s `fromNodeHeaders` per
 * the better-auth source at
 * <https://github.com/better-auth/better-auth/blob/main/packages/better-auth/src/integrations/node.ts>
 * (retrieved 2026-05-15). Kept inline so this CJS file doesn't have to
 * dynamic-import an ESM-only subpath on the hot request path.
 */
export function nodeHeadersToFetchHeaders(nodeHeaders: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(name, v);
    } else {
      headers.append(name, value);
    }
  }
  return headers;
}
