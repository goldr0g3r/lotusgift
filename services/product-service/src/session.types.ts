import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Local narrow session-payload shape consumed by product-service
 * controllers. Mirrors `services/vendor-service/src/session.types.ts`
 * (P6) — we re-declare locally instead of importing from the auth- /
 * vendor-service public surface to avoid the cross-service edge
 * (`microservice-boundaries.mdc` rule). The decorators are trivial
 * 6-liners; re-defining them here keeps product-service swap-out-able
 * to its own Nest process.
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

export const Session = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ session?: unknown }>();
  if (!request.session) {
    throw new Error(
      'No active session on request. Ensure the global AuthGuard (P5b) ran or decorate the handler with @AllowAnonymous().',
    );
  }
  return request.session;
});

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user?: unknown }>();
  if (!request.user) {
    throw new Error(
      'No active user on request. Ensure the global AuthGuard (P5b) ran or decorate the handler with @AllowAnonymous().',
    );
  }
  return request.user;
});
