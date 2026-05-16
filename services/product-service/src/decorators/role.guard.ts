import {
  CanActivate,
  ForbiddenException,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { REQUIRE_ROLE_KEY } from './require-role.decorator.js';

interface SessionUser {
  role?: string;
  roles?: readonly string[];
}

interface RequestWithUser {
  user?: SessionUser;
}

/**
 * Per-controller / per-handler role-check guard. Reads
 * `REQUIRE_ROLE_KEY` metadata + the `request.user` payload that the
 * upstream global `AuthGuard` (from P5b) attached to the request.
 *
 * Mirrors the P6 `services/vendor-service/src/decorators/role.guard.ts`
 * — we re-declare locally instead of cross-importing per
 * `microservice-boundaries.mdc`.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(
      REQUIRE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        message: 'Authenticated session required for this endpoint',
        code: 'AUTH_FORBIDDEN',
        requiredRole: required,
        currentRoles: [],
      });
    }
    const userRoles: string[] = [];
    if (typeof user.role === 'string') userRoles.push(user.role);
    if (Array.isArray(user.roles)) userRoles.push(...user.roles);

    const ok = required.some((r) => userRoles.includes(r));
    if (!ok) {
      throw new ForbiddenException({
        message: `Role check failed (required: ${required.join('|')}, current: ${userRoles.join(',') || '<none>'})`,
        code: 'AUTH_FORBIDDEN',
        requiredRole: required,
        currentRoles: userRoles,
      });
    }
    return true;
  }
}
