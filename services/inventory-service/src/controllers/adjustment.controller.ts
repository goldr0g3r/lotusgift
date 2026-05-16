import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import { AdjustmentRequestSchema } from '@repo/validators';
import { RequireRole, RoleGuard } from '@lotusgift/vendor-service';

import { AdjustmentService } from '../services/adjustment.service.js';
import { WarehouseOwnershipGuard } from '../decorators/index.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';

export class AdjustmentRequestDto extends createZodDto(AdjustmentRequestSchema) {}

@Controller('inventory/adjustments')
@UseGuards(RoleGuard, WarehouseOwnershipGuard)
export class AdjustmentController {
  constructor(private readonly adjustments: AdjustmentService) {}

  @Post()
  @RequireRole('admin', 'warehouse-manager')
  async adjust(
    @Body() body: AdjustmentRequestDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ): Promise<{ ok: true }> {
    await this.adjustments.adjust({
      ...body,
      actorId: user?.id ?? 'system',
    });
    return { ok: true };
  }
}
