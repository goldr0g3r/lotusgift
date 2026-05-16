import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';

import { VendorService } from '@lotusgift/vendor-service';

interface SessionUser {
  role?: string;
  roles?: readonly string[];
}

interface SessionLike {
  activeOrganizationId?: string;
}

interface RequestLike {
  user?: SessionUser;
  session?: SessionLike;
}

/**
 * Per-request guard that asserts the authenticated user's active
 * organization is bound to a vendor in `ACTIVATED` status. Implements
 * the parent-plan §p6 acceptance criterion: "Vendor in DRAFT or
 * PENDING_REVIEW status CANNOT create products."
 *
 * Cross-service VendorService injection is legal per phase-7 D13 +
 * `.cursor/rules/deployment-mode.mdc` — the modular monolith hosts
 * every business module as a Nest library; the public export surface
 * of `@lotusgift/vendor-service` (the `VendorService` class) is
 * explicitly part of the contract.
 *
 * Admin role bypasses the gate (admin can list / mutate any product
 * regardless of vendor status).
 */
@Injectable()
export class VendorActiveGuard implements CanActivate {
  constructor(@Inject(VendorService) private readonly vendors: VendorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const userRoles = this.collectRoles(request.user);
    if (userRoles.includes('admin')) return true;

    const activeOrgId = request.session?.activeOrganizationId;
    if (!activeOrgId) {
      throw new ForbiddenException({
        message: 'Active organization required to create or modify products',
        code: 'AUTH_FORBIDDEN',
      });
    }

    const vendor = await this.vendors.getByOrgId(activeOrgId);
    if (!vendor) {
      throw new ForbiddenException({
        message: `No vendor profile bound to active organization ${activeOrgId}`,
        code: 'VENDOR_NOT_FOUND',
        activeOrgId,
      });
    }

    if (vendor.status !== 'ACTIVATED') {
      throw new ForbiddenException({
        message: `Vendor must be ACTIVATED to create or modify products (current status: ${vendor.status})`,
        code: 'VENDOR_NOT_ACTIVATED',
        activeOrgId,
        currentStatus: vendor.status,
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
