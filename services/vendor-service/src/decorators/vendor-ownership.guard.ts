import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';

import { VendorService } from '../services/vendor.service.js';

interface SessionUser {
  role?: string;
  roles?: readonly string[];
}

interface SessionLike {
  activeOrganizationId?: string;
}

interface RequestLike {
  params?: Record<string, string | undefined>;
  user?: SessionUser;
  session?: SessionLike;
}

/**
 * Per-request guard that asserts the authenticated user's active
 * organization either owns the `vendorId` param being mutated, OR the
 * user has admin role. Throws RFC 9457 `AUTH_FORBIDDEN` ProblemDetails
 * on mismatch.
 *
 * Pulls the vendor id from the first matching path param —
 * `:vendorId` or `:id`. Controllers that mutate vendor-scoped resources
 * (warehouse create, warehouse toggle, tier change, payouts read) wire
 * this guard so any signed-in user CAN'T touch another vendor's data
 * by guessing the id.
 *
 * Admin role bypasses ownership check entirely; for admin-only
 * mutations use `@RequireRole('admin')` + `RoleGuard` instead (skip
 * this guard).
 */
@Injectable()
export class VendorOwnershipGuard implements CanActivate {
  constructor(@Inject(VendorService) private readonly vendorService: VendorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const userRoles = this.collectRoles(request.user);
    if (userRoles.includes('admin')) return true;

    const vendorId = request.params?.vendorId ?? request.params?.id;
    if (!vendorId) {
      throw new ForbiddenException({
        message: 'Vendor id missing from request — cannot enforce ownership',
        code: 'AUTH_FORBIDDEN',
      });
    }

    const activeOrgId = request.session?.activeOrganizationId;
    if (!activeOrgId) {
      throw new ForbiddenException({
        message: 'Active organization required to access vendor resources',
        code: 'AUTH_FORBIDDEN',
        vendorId,
      });
    }

    const vendor = await this.vendorService.getById(vendorId);
    if (vendor.orgId !== activeOrgId) {
      throw new ForbiddenException({
        message: `Vendor ${vendorId} is not owned by the active organization`,
        code: 'AUTH_FORBIDDEN',
        vendorId,
        activeOrgId,
      });
    }
    return true;
  }

  private collectRoles(user: SessionUser | undefined): string[] {
    if (!user) return [];
    const roles: string[] = [];
    if (typeof user.role === 'string') roles.push(user.role);
    if (Array.isArray(user.roles)) roles.push(...user.roles);
    return roles;
  }
}
