import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { VendorListQuerySchema } from '@repo/validators';

import { Session, type SessionPayload } from '../session.types.js';
import { RequireRole, RoleGuard, VendorOwnershipGuard } from '../decorators/index.js';
import { VendorService } from '../services/vendor.service.js';
import { mapVendorToResponse } from './mappers/vendor-response.mapper.js';

export class VendorListQueryDto extends createZodDto(VendorListQuerySchema) {}

/**
 * Vendor profile read endpoints. The authenticated session is consumed
 * directly via the upstream `AuthGuard` (P5b — registered globally on
 * the api-gateway); per-endpoint `@AllowAnonymous` opts out where needed.
 *
 * `GET /api/vendors` is admin-only (RoleGuard via `@RequireRole('admin')`)
 * since it leaks aggregate counts of all vendors on the platform.
 */
@Controller('vendors')
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  /**
   * Admin list endpoint. Filter by status / tier; paginated. Query
   * parameters validated via `VendorListQuerySchema` (Zod coerce on
   * page/limit; admin-only via @RequireRole + RoleGuard).
   */
  @Get()
  @UseGuards(RoleGuard)
  @RequireRole('admin')
  async list(@Query() query: VendorListQueryDto): Promise<{
    items: ReturnType<typeof mapVendorToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.vendorService.list({
      status: query.status,
      tier: query.tier,
      page: query.page,
      limit: query.limit,
    });
    return {
      items: result.items.map(mapVendorToResponse),
      pagination: result.pagination,
    };
  }

  /**
   * Single vendor profile. Ownership-gated: the requester must own
   * the vendor (active organization match) or have admin role.
   * Returns PII (contactEmail, contactPhone) so it cannot be public.
   */
  @Get(':id')
  @UseGuards(VendorOwnershipGuard)
  async getById(@Param('id') id: string): Promise<ReturnType<typeof mapVendorToResponse>> {
    const vendor = await this.vendorService.getById(id);
    return mapVendorToResponse(vendor);
  }

  /**
   * Convenience endpoint: returns the vendor profile bound to the
   * authenticated session's active org. Useful for the web-vendor
   * dashboard's bootstrap query.
   */
  @Get('me/current')
  async getMyVendor(
    @Session() session: SessionPayload,
  ): Promise<ReturnType<typeof mapVendorToResponse> | null> {
    if (!session.activeOrganizationId) return null;
    const vendor = await this.vendorService.getByOrgId(session.activeOrganizationId);
    return vendor ? mapVendorToResponse(vendor) : null;
  }
}
