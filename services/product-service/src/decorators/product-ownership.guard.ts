import {
  CanActivate,
  ForbiddenException,
  Inject,
  Injectable,
  type ExecutionContext,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { PRODUCT_MODEL, type ProductDocument } from '../schemas/product.schema.js';

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
 * organization owns the `productId` param being mutated, OR the user
 * has admin role. Throws RFC 9457 `AUTH_FORBIDDEN` ProblemDetails on
 * mismatch.
 *
 * Pulls the product id from `:productId` or `:id` path param. Mirrors
 * the `VendorOwnershipGuard` pattern from P6 — every mutation handler
 * on `services/product-service` that takes a `:productId` param wires
 * this guard so any signed-in user CAN'T touch another vendor's product
 * by guessing the id.
 *
 * Admin role bypasses ownership entirely; for admin-only mutations use
 * `@RequireRole('admin')` + `RoleGuard` instead (skip this guard).
 */
@Injectable()
export class ProductOwnershipGuard implements CanActivate {
  constructor(
    @InjectModel(PRODUCT_MODEL) private readonly productModel: Model<ProductDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const userRoles = this.collectRoles(request.user);
    if (userRoles.includes('admin')) return true;

    const productId = request.params?.productId ?? request.params?.id;
    if (!productId) {
      throw new ForbiddenException({
        message: 'Product id missing from request — cannot enforce ownership',
        code: 'AUTH_FORBIDDEN',
      });
    }

    const activeOrgId = request.session?.activeOrganizationId;
    if (!activeOrgId) {
      throw new ForbiddenException({
        message: 'Active organization required to access product resources',
        code: 'AUTH_FORBIDDEN',
        productId,
      });
    }

    const product = await this.productModel.findOne({ id: productId }).exec();
    if (!product) {
      throw new ForbiddenException({
        message: `Product ${productId} not found`,
        code: 'AUTH_FORBIDDEN',
        productId,
      });
    }
    if (product.orgId !== activeOrgId) {
      throw new ForbiddenException({
        message: `Product ${productId} is not owned by the active organization`,
        code: 'AUTH_FORBIDDEN',
        productId,
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
