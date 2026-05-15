import { Reflector } from '@nestjs/core';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';

import { AuthGuard, nodeHeadersToFetchHeaders } from './auth.guard.js';
import { ALLOW_ANONYMOUS_KEY } from './decorators.js';
import type { BetterAuthInstance } from './build-better-auth-instance.js';

function buildContext(opts: {
  headers?: Record<string, string | string[] | undefined>;
  request?: Record<string, unknown>;
}): ExecutionContext {
  const request = {
    headers: opts.headers ?? {},
    ...(opts.request ?? {}),
  };
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function reflectorReturning(value: unknown): Reflector {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(value as never);
  return reflector;
}

describe('AuthGuard', () => {
  it('allows the request through when @AllowAnonymous is set', async () => {
    const reflector = reflectorReturning(true);
    const auth = {
      api: { getSession: jest.fn() },
    } as unknown as BetterAuthInstance;
    const guard = new AuthGuard(reflector, auth);

    await expect(guard.canActivate(buildContext({}))).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ALLOW_ANONYMOUS_KEY, expect.any(Array));
    expect(auth.api.getSession).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException with AUTH_INVALID_TOKEN when no session', async () => {
    const reflector = reflectorReturning(false);
    const auth = {
      api: { getSession: jest.fn().mockResolvedValue(null) },
    } as unknown as BetterAuthInstance;
    const guard = new AuthGuard(reflector, auth);

    await expect(guard.canActivate(buildContext({}))).rejects.toMatchObject({
      response: { code: 'AUTH_INVALID_TOKEN', message: 'Authentication required' },
    });
    await expect(guard.canActivate(buildContext({}))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('sets request.session and request.user when a session is present', async () => {
    const reflector = reflectorReturning(false);
    const session = { id: 'sess_1' };
    const user = { id: 'usr_1', email: 'a@b.c' };
    const auth = {
      api: { getSession: jest.fn().mockResolvedValue({ session, user }) },
    } as unknown as BetterAuthInstance;
    const guard = new AuthGuard(reflector, auth);
    const request: Record<string, unknown> = { headers: { cookie: 'better-auth.session_token=xxx' } };
    const ctx = {
      getHandler: () => () => undefined,
      getClass: () => class {},
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.session).toEqual(session);
    expect(request.user).toEqual(user);
  });

  it('passes the converted Fetch Headers to auth.api.getSession', async () => {
    const reflector = reflectorReturning(false);
    const auth = {
      api: {
        getSession: jest.fn().mockResolvedValue({ session: {}, user: {} }),
      },
    } as unknown as BetterAuthInstance;
    const guard = new AuthGuard(reflector, auth);

    await guard.canActivate(
      buildContext({
        headers: {
          cookie: 'better-auth.session_token=abc',
          'x-custom': ['one', 'two'],
        },
      }),
    );

    const [{ headers }] = (auth.api.getSession as jest.Mock).mock.calls[0] as [{ headers: Headers }];
    expect(headers).toBeInstanceOf(Headers);
    expect(headers.get('cookie')).toBe('better-auth.session_token=abc');
    // Multi-value headers collapse to a comma-joined list per Headers.append semantics.
    expect(headers.get('x-custom')).toBe('one, two');
  });
});

describe('nodeHeadersToFetchHeaders', () => {
  it('handles undefined / string / string[] values without throwing', () => {
    const fetchHeaders = nodeHeadersToFetchHeaders({
      host: 'localhost',
      cookie: 'a=1',
      'x-undefined': undefined,
      'x-multi': ['a', 'b'],
    });
    expect(fetchHeaders.get('host')).toBe('localhost');
    expect(fetchHeaders.get('cookie')).toBe('a=1');
    expect(fetchHeaders.get('x-undefined')).toBeNull();
    expect(fetchHeaders.get('x-multi')).toBe('a, b');
  });
});
