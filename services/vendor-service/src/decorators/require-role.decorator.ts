import { SetMetadata } from '@nestjs/common';

/**
 * Reflector metadata key consumed by `RoleGuard`. Lightweight extension
 * of the global `AuthGuard` from P5b — per D19 in the phase-6 research
 * note, we do NOT register a second guard at `APP_GUARD`; instead a
 * per-controller `RoleGuard` reads this key + the request session set
 * by the upstream `AuthGuard`.
 */
export const REQUIRE_ROLE_KEY = 'lotusgift:requireRole';

/**
 * Restrict a controller / handler to sessions whose `user.role` matches
 * one of the supplied roles. Throws `ForbiddenException` with
 * `code: 'AUTH_FORBIDDEN'` on mismatch — the global
 * `GlobalProblemDetailsFilter` renders the RFC 9457 envelope.
 *
 * Usage:
 *
 * ```ts
 * @Controller('admin/vendor-approvals')
 * @UseGuards(RoleGuard)
 * @RequireRole('admin')
 * export class AdminApprovalController { ... }
 * ```
 *
 * Multiple roles (any-match) supported via varargs.
 */
export const RequireRole = (...roles: string[]): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_ROLE_KEY, roles) as MethodDecorator & ClassDecorator;
