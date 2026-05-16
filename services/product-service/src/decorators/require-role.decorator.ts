import { SetMetadata, type CustomDecorator } from '@nestjs/common';

/**
 * Reflector metadata key used by `RoleGuard` to look up the required
 * role(s) for a handler / class. Re-declared locally instead of
 * importing from `@lotusgift/vendor-service` to avoid the
 * cross-service edge — `microservice-boundaries.mdc` bans direct
 * `services/* → services/*` imports.
 *
 * The string symbol stays identical across the two services so the
 * AuthGuard's reflector lookup hits the same key regardless of which
 * service mounted the controller.
 */
export const REQUIRE_ROLE_KEY = 'lotusgift:require-role';

/**
 * `@RequireRole('admin')` — declarative role gate read by `RoleGuard`
 * via `Reflector.getAllAndOverride`. Accepts a single role or an
 * array of acceptable roles (OR semantics).
 */
export const RequireRole = (...roles: string[]): CustomDecorator =>
  SetMetadata(REQUIRE_ROLE_KEY, roles);
