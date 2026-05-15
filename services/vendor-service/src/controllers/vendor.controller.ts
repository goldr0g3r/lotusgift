import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { Session, type SessionPayload } from '../session.types.js';
import { RequireRole, RoleGuard } from '../decorators/index.js';
import { VendorService } from '../services/vendor.service.js';
import { mapVendorToResponse } from './mappers/vendor-response.mapper.js';

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
   * Admin list endpoint. Filter by status / tier; paginated.
   */
  @Get()
  @UseGuards(RoleGuard)
  @RequireRole('admin')
  async list(
    @Query('status') status?: string,
    @Query('tier') tier?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ): Promise<{
    items: ReturnType<typeof mapVendorToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.vendorService.list({
      status: status as never,
      tier: tier as never,
      page: pageRaw ? Number(pageRaw) : undefined,
      limit: limitRaw ? Number(limitRaw) : undefined,
    });
    return {
      items: result.items.map(mapVendorToResponse),
      pagination: result.pagination,
    };
  }

  @Get(':id')
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
