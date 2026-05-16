import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  VariantCreateRequestSchema,
  VariantUpdateRequestSchema,
} from '@repo/validators';

import { ProductOwnershipGuard, VendorActiveGuard } from '../decorators/index.js';
import { VariantService } from '../services/variant.service.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { mapProductToResponse } from './mappers/product-response.mapper.js';

export class VariantCreateRequestDto extends createZodDto(VariantCreateRequestSchema) {}
export class VariantUpdateRequestDto extends createZodDto(VariantUpdateRequestSchema) {}

/**
 * Variant CRUD on a vendor-scoped product. ProductOwnershipGuard
 * resolves the `:productId` param so any signed-in user can't mutate
 * another vendor's variants by guessing the id.
 */
@Controller('products/:productId/variants')
@UseGuards(VendorActiveGuard, ProductOwnershipGuard)
export class VariantController {
  constructor(private readonly variants: VariantService) {}

  @Post()
  async addVariant(
    @Param('productId') productId: string,
    @Body() body: VariantCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.variants.addVariant({
      productId,
      payload: body as unknown as Parameters<VariantService['addVariant']>[0]['payload'],
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }

  @Patch(':variantId')
  async updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() body: VariantUpdateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.variants.updateVariant({
      productId,
      variantId,
      patch: body as unknown as Parameters<VariantService['updateVariant']>[0]['patch'],
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }

  @Delete(':variantId')
  async removeVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.variants.removeVariant({
      productId,
      variantId,
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }
}
