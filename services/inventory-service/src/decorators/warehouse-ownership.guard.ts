import {
  CanActivate,
  ForbiddenException,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';

import { WarehouseService } from '@lotusgift/vendor-service';

interface SessionUser {
  role?: string;
  roles?: readonly string[];
}

interface SessionLike {
  activeOrganizationId?: string;
}

interface RequestLike {
  params?: Record<string, string | undefined>;
  body?: { warehouseId?: string };
  user?: SessionUser;
  session?: SessionLike;
}

@Injectable()
export class WarehouseOwnershipGuard implements CanActivate {
  constructor(private readonly warehouses: WarehouseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const userRoles = this.collectRoles(request.user);
    if (userRoles.includes('admin')) return true;

    const warehouseId =
      request.params?.warehouseId ??
      request.body?.warehouseId ??
      request.params?.fromWarehouseId;
    if (!warehouseId) {
      throw new ForbiddenException({
        message: 'Warehouse id missing — cannot enforce ownership',
        code: 'WAREHOUSE_OWNERSHIP_REQUIRED',
      });
    }

    const activeOrgId = request.session?.activeOrganizationId;
    if (!activeOrgId) {
      throw new ForbiddenException({
        message: 'Active organization required to access warehouse resources',
        code: 'AUTH_FORBIDDEN',
        warehouseId,
      });
    }

    const warehouse = await this.warehouses.findById(warehouseId);
    if (!warehouse) {
      throw new ForbiddenException({
        message: `Warehouse ${warehouseId} not found`,
        code: 'AUTH_FORBIDDEN',
        warehouseId,
      });
    }
    if (warehouse.orgId !== activeOrgId) {
      throw new ForbiddenException({
        message: `Warehouse ${warehouseId} is not owned by the active organization`,
        code: 'AUTH_FORBIDDEN',
        warehouseId,
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
