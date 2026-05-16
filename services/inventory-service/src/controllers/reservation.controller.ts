import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  ReservationCreateRequestSchema,
  ReservationExtendRequestSchema,
} from '@repo/validators';
import { RequireRole, RoleGuard } from '@lotusgift/vendor-service';

import { ReservationService } from '../services/reservation.service.js';
import { WarehouseOwnershipGuard } from '../decorators/index.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';

export class ReservationCreateDto extends createZodDto(ReservationCreateRequestSchema) {}
export class ReservationExtendDto extends createZodDto(ReservationExtendRequestSchema) {}

@Controller('inventory/reservations')
@UseGuards(RoleGuard, WarehouseOwnershipGuard)
export class ReservationController {
  constructor(private readonly reservations: ReservationService) {}

  @Post()
  @RequireRole('admin', 'warehouse-manager')
  async create(
    @Body() body: ReservationCreateDto,
    @Headers('idempotency-key') headerKey: string | undefined,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ): Promise<unknown> {
    const idempotencyKey = headerKey ?? body.idempotencyKey;
    const actorId = user?.id ?? body.actorId;
    const row = await this.reservations.create({
      variantId: body.variantId,
      warehouseId: body.warehouseId,
      qty: body.qty,
      idempotencyKey,
      cartId: body.cartId,
      actorId,
    });
    return {
      reservationId: row.reservationId,
      variantId: row.variantId,
      warehouseId: row.warehouseId,
      qty: row.qty,
      status: row.status,
      expiresAt: row.ttlExpiresAt.toISOString(),
      idempotencyKey: row.idempotencyKey,
    };
  }

  @Post(':id/extend')
  @RequireRole('admin', 'warehouse-manager')
  async extend(
    @Param('id') id: string,
    @Body() body: ReservationExtendDto,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ): Promise<{ ok: true }> {
    const audit = await this.reservations.getByReservationId(id);
    if (!audit) {
      return { ok: true };
    }
    await this.reservations.extend(
      id,
      body.idempotencyKey ?? audit.idempotencyKey,
      audit.variantId,
      audit.warehouseId,
      user?.id ?? 'system',
    );
    return { ok: true };
  }

  @Delete(':id')
  @RequireRole('admin', 'warehouse-manager')
  async release(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload | undefined,
  ): Promise<void> {
    const audit = await this.reservations.getByReservationId(id);
    if (!audit) return;
    await this.reservations.release(
      audit.variantId,
      audit.warehouseId,
      audit.idempotencyKey,
      user?.id ?? 'system',
    );
  }

  @Get(':id')
  @RequireRole('admin', 'warehouse-manager')
  async get(@Param('id') id: string): Promise<unknown> {
    const audit = await this.reservations.getByReservationId(id);
    if (!audit) return null;
    return {
      reservationId: audit.reservationId,
      variantId: audit.variantId,
      warehouseId: audit.warehouseId,
      qty: audit.qty,
      status: audit.status,
      expiresAt: audit.ttlExpiresAt.toISOString(),
    };
  }
}
