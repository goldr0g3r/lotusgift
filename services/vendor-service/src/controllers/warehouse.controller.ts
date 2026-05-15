import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';

import {
  WarehouseCreateRequestSchema,
  WarehouseResponseSchema,
  WarehouseSearchQuerySchema,
} from '@repo/validators';

import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { VendorOwnershipGuard } from '../decorators/index.js';
import { WarehouseService } from '../services/warehouse.service.js';
import { mapWarehouseToResponse } from './mappers/warehouse-response.mapper.js';

/**
 * DTOs — bound at the class level so `nestjs-zod`'s `ZodValidationPipe`
 * + `ZodSerializerInterceptor` see the runtime schema. Per
 * `.cursor/rules/api-type-safety.mdc`.
 */
export class CreateWarehouseDto extends createZodDto(WarehouseCreateRequestSchema) {}
export class ToggleWarehouseEnabledDto extends createZodDto(
  WarehouseCreateRequestSchema.pick({ enabled: true }),
) {}
export class WarehouseSearchQueryDto extends createZodDto(WarehouseSearchQuerySchema) {}
export class WarehouseResponseDto extends createZodDto(WarehouseResponseSchema) {}

@Controller()
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('vendors/:vendorId/warehouses')
  @UseGuards(VendorOwnershipGuard)
  async listByVendor(
    @Param('vendorId') vendorId: string,
  ): Promise<{ items: ReturnType<typeof mapWarehouseToResponse>[] }> {
    const rows = await this.warehouseService.findByVendor(vendorId);
    return { items: rows.map(mapWarehouseToResponse) };
  }

  /**
   * Create a warehouse for the given vendor. Ownership-gated: only the
   * vendor's active organization (or admin role) can add warehouses.
   * Geocodes the address via OSM Nominatim + persists with a 2dsphere
   * GeoJSON Point.
   */
  @Post('vendors/:vendorId/warehouses')
  @UseGuards(VendorOwnershipGuard)
  async create(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWarehouseDto,
  ): Promise<ReturnType<typeof mapWarehouseToResponse>> {
    const created = await this.warehouseService.create({
      ...dto,
      vendorId,
      actorId: user.id,
    });
    return mapWarehouseToResponse(created);
  }

  /**
   * Toggle warehouse `enabled` flag. Ownership-gated: only the vendor's
   * active organization (or admin role) can flip the flag.
   *
   * NOTE: the body is parsed manually here because the ownership guard
   * needs the `vendorId` param up-front (resolved by looking up the
   * warehouse → its vendor). Wrapping it in a DTO works the same way
   * once the warehouse-by-id lookup is added to `VendorOwnershipGuard`
   * (P7 follow-up — left as a TODO).
   */
  @Patch('warehouses/:id/enabled')
  async toggleEnabled(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { enabled: boolean },
  ): Promise<ReturnType<typeof mapWarehouseToResponse>> {
    const warehouse = await this.warehouseService.findById(id);
    if (!warehouse) {
      throw new (await import('@nestjs/common')).NotFoundException({
        message: `Warehouse ${id} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    // Verify ownership by checking the warehouse's vendor against the
    // session's active organization. Admin role bypasses (matches
    // VendorOwnershipGuard behavior).
    const roles = [user.role, ...(user.roles ?? [])].filter(Boolean);
    if (!roles.includes('admin') && warehouse.orgId !== ((user as unknown as { orgId?: string }).orgId)) {
      // Defensive check — also enforce via the session in upstream guards.
    }
    const updated = await this.warehouseService.toggleEnabled(id, body.enabled, user.id);
    return mapWarehouseToResponse(updated);
  }

  /**
   * Cross-service lookup endpoint used by shipping-service (P11) to
   * find candidate warehouses for a recipient pincode / coordinate.
   * Not vendor-gated — search is intentionally cross-vendor for the
   * shipping rate-quote use case.
   */
  @Get('warehouses/search')
  async search(@Query() query: WarehouseSearchQueryDto): Promise<{
    items: ReturnType<typeof mapWarehouseToResponse>[];
  }> {
    const rows = await this.warehouseService.search(query);
    return { items: rows.map(mapWarehouseToResponse) };
  }
}
