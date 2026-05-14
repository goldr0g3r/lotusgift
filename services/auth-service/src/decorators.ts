import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Reflector key consumed by `AuthGuard` to allow anonymous access on
 * an endpoint.
 */
export const ALLOW_ANONYMOUS_KEY = 'lotusgift:allowAnonymous';

/**
 * Opt the decorated handler / controller out of the global AuthGuard.
 * Use sparingly — anything that doesn't need an authenticated session
 * must be explicitly allow-listed.
 */
export const AllowAnonymous = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_ANONYMOUS_KEY, true) as MethodDecorator & ClassDecorator;

/**
 * Param decorator that returns the active session attached to the
 * request by `AuthGuard`. Throws if no session is present — controllers
 * that may receive anonymous traffic must use `@AllowAnonymous()` and
 * read `request.session` manually instead.
 */
export const Session = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ session?: unknown }>();
  if (!request.session) {
    throw new Error(
      'No active session on request. Either decorate the handler with @AllowAnonymous() or ensure AuthGuard ran.',
    );
  }
  return request.session;
});

/**
 * Param decorator that returns just the active user (subset of the
 * session payload). Throws if no session is present.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
  if (!request.user) {
    throw new Error(
      'No active user on request. Either decorate the handler with @AllowAnonymous() or ensure AuthGuard ran.',
    );
  }
  return request.user;
});
