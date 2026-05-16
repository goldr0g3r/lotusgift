import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  ProductCreateRequestSchema,
  ProductListQuerySchema,
  ProductUpdateRequestSchema,
} from '@repo/validators';

import { ImageService } from '../services/image.service.js';
import { ProductService } from '../services/product.service.js';
import {
  ProductOwnershipGuard,
  VendorActiveGuard,
} from '../decorators/index.js';
import { Session, CurrentUser, type CurrentUserPayload, type SessionPayload } from '../session.types.js';
import { mapProductToResponse } from './mappers/product-response.mapper.js';
import type { ProductDocument } from '../schemas/product.schema.js';

export class ProductCreateRequestDto extends createZodDto(ProductCreateRequestSchema) {}
export class ProductUpdateRequestDto extends createZodDto(ProductUpdateRequestSchema) {}
export class ProductListQueryDto extends createZodDto(ProductListQuerySchema) {}

/**
 * Vendor-scoped product CRUD. Auth-gated (via the global P5b
 * AuthGuard); writes additionally gated by
 * `VendorActiveGuard` (vendor must be ACTIVATED) +
 * `ProductOwnershipGuard` (the active org must own the product).
 *
 * Public reads (`GET /api/products/:id`, `GET /api/products/by-slug/:slug`,
 * `GET /api/products/search`) handle their own anonymous-allowed
 * surface area on the dedicated `SearchController` / via @AllowAnonymous
 * at the gateway.
 */
@Controller('products')
export class ProductController {
  constructor(
    private readonly products: ProductService,
    private readonly images: ImageService,
  ) {}

  @Get()
  async list(@Query() query: ProductListQueryDto): Promise<{
    items: ReturnType<typeof mapProductToResponse>[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const result = await this.products.list({
      vendorId: query.vendorId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
    const items = await Promise.all(
      result.items.map((p) => this.mapWithImages(p, result.availableStockByVariant)),
    );
    return { items, pagination: result.pagination };
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.products.getById(id);
    const stockByVariant = await this.products.batchGetStock([product]);
    return this.mapWithImages(product, stockByVariant);
  }

  @Post()
  @UseGuards(VendorActiveGuard)
  async create(
    @Body() body: ProductCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
    @Session() session: SessionPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const orgId = session.activeOrganizationId;
    if (!orgId) {
      throw new Error('Active organization required to create products');
    }
    const product = await this.products.create({
      ...(body as unknown as Parameters<ProductService['create']>[0]),
      vendorId: orgId,
      orgId,
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }

  @Patch(':id')
  @UseGuards(VendorActiveGuard, ProductOwnershipGuard)
  async update(
    @Param('id') id: string,
    @Body() body: ProductUpdateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.products.update({
      productId: id,
      patch: body as unknown as Parameters<ProductService['update']>[0]['patch'],
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }

  @Post(':id/publish')
  @UseGuards(VendorActiveGuard, ProductOwnershipGuard)
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.products.publish({ productId: id, actorId: user.id });
    return mapProductToResponse(product);
  }

  @Post(':id/unpublish')
  @UseGuards(VendorActiveGuard, ProductOwnershipGuard)
  async unpublish(
    @Param('id') id: string,
    @Body() body: { reason?: string } | undefined,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.products.unpublish({
      productId: id,
      reason: body?.reason,
      actorId: user.id,
    });
    return mapProductToResponse(product);
  }

  @Delete(':id')
  @UseGuards(VendorActiveGuard, ProductOwnershipGuard)
  async archive(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const product = await this.products.archive({ productId: id, actorId: user.id });
    return mapProductToResponse(product);
  }

  private async mapWithImages(
    product: ProductDocument,
    stockByVariant?: Map<string, number>,
  ): Promise<ReturnType<typeof mapProductToResponse>> {
    const imgs = await this.images.listForProduct(product.id);
    return mapProductToResponse(product, {
      imageR2Keys: imgs.map((i) => i.r2Key),
      availableStockByVariant: stockByVariant,
    });
  }
}
