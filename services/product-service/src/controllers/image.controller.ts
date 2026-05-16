import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';

import {
  ImageConfirmRequestSchema,
  ImageUploadUrlRequestSchema,
  type ImageUploadUrlResponse,
} from '@repo/validators';

import { ImageService } from '../services/image.service.js';
import { ProductOwnershipGuard, VendorActiveGuard } from '../decorators/index.js';
import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { mapImageToResponse } from './mappers/image-response.mapper.js';

export class ImageUploadUrlRequestDto extends createZodDto(ImageUploadUrlRequestSchema) {}
export class ImageConfirmRequestDto extends createZodDto(ImageConfirmRequestSchema) {}

/**
 * Two-step R2 image upload endpoints. Gated by VendorActiveGuard +
 * ProductOwnershipGuard so only the active vendor org can mutate
 * its product images.
 */
@Controller('products/:productId/images')
@UseGuards(VendorActiveGuard, ProductOwnershipGuard)
export class ImageController {
  constructor(private readonly images: ImageService) {}

  @Post('upload-url')
  async issueUploadUrl(
    @Param('productId') productId: string,
    @Body() body: ImageUploadUrlRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ImageUploadUrlResponse> {
    return this.images.issueUploadUrl({
      productId,
      payload: body as unknown as Parameters<ImageService['issueUploadUrl']>[0]['payload'],
      actorId: user.id,
    });
  }

  @Post('confirm')
  async confirmUpload(
    @Param('productId') productId: string,
    @Body() body: ImageConfirmRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ReturnType<typeof mapImageToResponse>> {
    const image = await this.images.confirmUpload({
      productId,
      payload: body as unknown as Parameters<ImageService['confirmUpload']>[0]['payload'],
      actorId: user.id,
    });
    return mapImageToResponse(image, {
      publicUrl: this.images.publicUrlFor(image.r2Key),
    });
  }
}
