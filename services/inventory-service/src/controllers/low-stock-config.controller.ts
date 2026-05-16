import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { LowStockThresholdSchema } from '@repo/validators';
import { RequireRole, RoleGuard } from '@lotusgift/vendor-service';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import {
  LOW_STOCK_CONFIG_MODEL,
  STOCK_SNAPSHOT_MODEL,
  type LowStockConfigDocument,
  type StockSnapshotDocument,
} from '../schemas/index.js';
import { WarehouseOwnershipGuard } from '../decorators/index.js';

export class LowStockThresholdDto extends createZodDto(LowStockThresholdSchema) {}

@Controller('inventory/low-stock-config')
@UseGuards(RoleGuard, WarehouseOwnershipGuard)
export class LowStockConfigController {
  constructor(
    @InjectModel(LOW_STOCK_CONFIG_MODEL)
    private readonly configModel: Model<LowStockConfigDocument>,
    @InjectModel(STOCK_SNAPSHOT_MODEL)
    private readonly snapshotModel: Model<StockSnapshotDocument>,
  ) {}

  @Get()
  @RequireRole('admin', 'warehouse-manager')
  async get(
    @Query('variantId') variantId: string,
    @Query('warehouseId') warehouseId: string,
  ): Promise<unknown> {
    const cfg = await this.configModel.findOne({ variantId, warehouseId }).exec();
    const snap = await this.snapshotModel.findOne({ variantId, warehouseId }).exec();
    return {
      variantId,
      warehouseId,
      lowStockThreshold: cfg?.lowStockThreshold ?? snap?.lowStockThreshold ?? 10,
      reorderPoint: cfg?.reorderPoint ?? snap?.reorderPoint ?? 5,
      reorderQty: cfg?.reorderQty ?? snap?.reorderQty ?? 50,
    };
  }

  @Put()
  @RequireRole('admin', 'warehouse-manager')
  async put(@Body() body: LowStockThresholdDto): Promise<{ ok: true }> {
    const snap = await this.snapshotModel
      .findOne({ variantId: body.variantId, warehouseId: body.warehouseId })
      .exec();
    await this.configModel
      .findOneAndUpdate(
        { variantId: body.variantId, warehouseId: body.warehouseId },
        {
          $set: {
            variantId: body.variantId,
            warehouseId: body.warehouseId,
            vendorId: snap?.vendorId ?? '',
            orgId: snap?.orgId ?? '',
            lowStockThreshold: body.lowStockThreshold,
            reorderPoint: body.reorderPoint,
            reorderQty: body.reorderQty,
          },
        },
        { upsert: true, new: true },
      )
      .exec();
    if (snap) {
      await this.snapshotModel
        .updateOne(
          { id: snap.id },
          {
            $set: {
              lowStockThreshold: body.lowStockThreshold,
              ...(body.reorderPoint !== undefined ? { reorderPoint: body.reorderPoint } : {}),
              ...(body.reorderQty !== undefined ? { reorderQty: body.reorderQty } : {}),
            },
          },
        )
        .exec();
    }
    return { ok: true };
  }
}
