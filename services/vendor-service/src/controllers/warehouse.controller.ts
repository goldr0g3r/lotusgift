import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import {
  WarehouseCreateRequestSchema,
  WarehouseSearchQuerySchema,
  type WarehouseSearchQuery,
} from '@repo/validators';

import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { WarehouseService } from '../services/warehouse.service.js';
import { mapWarehouseToResponse } from './mappers/warehouse-response.mapper.js';

@Controller()
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Get('vendors/:vendorId/warehouses')
  async listByVendor(
    @Param('vendorId') vendorId: string,
  ): Promise<{ items: ReturnType<typeof mapWarehouseToResponse>[] }> {
    const rows = await this.warehouseService.findByVendor(vendorId);
    return { items: rows.map(mapWarehouseToResponse) };
  }

  @Post('vendors/:vendorId/warehouses')
  async create(
    @Param('vendorId') vendorId: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() raw: unknown,
  ): Promise<ReturnType<typeof mapWarehouseToResponse>> {
    const parsed = WarehouseCreateRequestSchema.parse(raw);
    const created = await this.warehouseService.create({
      ...parsed,
      vendorId,
      actorId: user.id,
    });
    return mapWarehouseToResponse(created);
  }

  @Patch('warehouses/:id/enabled')
  async toggleEnabled(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { enabled: boolean },
  ): Promise<ReturnType<typeof mapWarehouseToResponse>> {
    const updated = await this.warehouseService.toggleEnabled(id, body.enabled, user.id);
    return mapWarehouseToResponse(updated);
  }

  /**
   * Cross-service lookup endpoint used by shipping-service (P11) to
   * find candidate warehouses for a recipient pincode / coordinate.
   */
  @Get('warehouses/search')
  async search(@Query() query: WarehouseSearchQuery): Promise<{
    items: ReturnType<typeof mapWarehouseToResponse>[];
  }> {
    const parsed = WarehouseSearchQuerySchema.parse(query);
    const rows = await this.warehouseService.search(parsed);
    return { items: rows.map(mapWarehouseToResponse) };
  }
}
