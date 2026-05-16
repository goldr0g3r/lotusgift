import { Injectable } from '@nestjs/common';

import type { AdjustmentRequest } from '@repo/validators';
import { WarehouseService } from '@lotusgift/vendor-service';
import { NotFoundException } from '@nestjs/common';

import { LedgerService } from './ledger.service.js';

@Injectable()
export class AdjustmentService {
  constructor(
    private readonly ledger: LedgerService,
    private readonly warehouses: WarehouseService,
  ) {}

  async adjust(input: AdjustmentRequest & { actorId: string }): Promise<void> {
    const warehouse = await this.warehouses.findById(input.warehouseId);
    if (!warehouse) {
      throw new NotFoundException({
        message: `Warehouse ${input.warehouseId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    await this.ledger.append({
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      orgId: warehouse.orgId,
      vendorId: warehouse.vendorId,
      delta: input.delta,
      reason: input.reason,
      reasonNote: input.reasonNote ?? null,
      actorId: input.actorId,
    });
  }
}
