import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Narrow session-payload shape consumed by vendor-service controllers.
 * The upstream AuthGuard (services/auth-service P5b) attaches the full
 * Better-Auth session object as `request.session` + the user as
 * `request.user`; the actual type is the plugin-intersected super-union
 * — we narrow here to just the fields we read.
 *
 * Why local decorators instead of importing from `@lotusgift/auth-service`?
 * The `.cursor/rules/microservice-boundaries.mdc` rule (enforced by
 * `.dependency-cruiser.cjs` rule `no-cross-service-import`) bans direct
 * `services/* → services/*` imports. The decorators are trivial
 * 6-liners; re-defining them locally avoids the cross-service edge
 * and keeps vendor-service swap-out-able to its own Nest process.
 *
 * The runtime contract is unchanged: the gateway-registered global
 * `AuthGuard` (from `@lotusgift/auth-service`) populates the same
 * `request.session` + `request.user` fields these decorators read.
 */

export interface SessionPayload {
  userId?: string;
  activeOrganizationId?: string;
  [key: string]: unknown;
}

export interface CurrentUserPayload {
  id: string;
  email?: string;
  role?: string;
  roles?: readonly string[];
  [key: string]: unknown;
}

/**
 * Param decorator that returns the active session attached to the
 * request by the upstream gateway `AuthGuard`. Throws if no session
 * is present — controllers that may receive anonymous traffic must
 * read `request.session` manually.
 */
export const Session = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ session?: unknown }>();
  if (!request.session) {
    throw new Error(
      'No active session on request. Ensure the global AuthGuard (P5b) ran or decorate the handler with @AllowAnonymous().',
    );
  }
  return request.session;
});

/**
 * Param decorator that returns the active user attached to the
 * request by the upstream gateway `AuthGuard`.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
  if (!request.user) {
    throw new Error(
      'No active user on request. Ensure the global AuthGuard (P5b) ran or decorate the handler with @AllowAnonymous().',
    );
  }
  return request.user;
});
