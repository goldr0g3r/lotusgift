import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { TransferListQuerySchema, TransferRequestSchema } from '@repo/validators';
import { RequireRole, RoleGuard } from '@lotusgift/vendor-service';

import { TransferService } from '../services/transfer.service.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { InjectModel } from '@nestjs/mongoose';
import { TRANSFER_MODEL, type TransferDocument } from '../schemas/index.js';
import type { Model } from 'mongoose';

export class TransferRequestDto extends createZodDto(TransferRequestSchema) {}
export class TransferListQueryDto extends createZodDto(TransferListQuerySchema) {}

@Controller('inventory/transfers')
@UseGuards(RoleGuard)
export class TransferController {
  constructor(
    private readonly transfers: TransferService,
    @InjectModel(TRANSFER_MODEL) private readonly transferModel: Model<TransferDocument>,
  ) {}

  @Post()
  @RequireRole('admin')
  async create(
    @Body() body: TransferRequestDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ): Promise<{ transferId: string }> {
    const row = await this.transfers.transfer({
      ...body,
      actorId: user?.id ?? 'admin',
    });
    return { transferId: row.id };
  }

  @Get()
  @RequireRole('admin')
  async list(@Query() query: TransferListQueryDto): Promise<{ items: unknown[] }> {
    const filter: Record<string, unknown> = {};
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.fromWarehouseId) filter.fromWarehouseId = query.fromWarehouseId;
    if (query.toWarehouseId) filter.toWarehouseId = query.toWarehouseId;
    if (query.status) filter.status = query.status;
    const items = await this.transferModel.find(filter).sort({ createdAt: -1 }).limit(100).exec();
    return { items };
  }
}
