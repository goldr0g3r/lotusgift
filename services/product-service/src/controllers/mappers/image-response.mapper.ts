import type { ImageResponse } from '@repo/validators';

import type { ProductImageDocument } from '../../schemas/image.schema.js';

export function mapImageToResponse(
  doc: ProductImageDocument,
  options: { publicUrl?: string | null } = {},
): ImageResponse {
  return {
    id: doc.id as ImageResponse['id'],
    productId: doc.productId as ImageResponse['productId'],
    r2Key: doc.r2Key as ImageResponse['r2Key'],
    kind: doc.kind,
    altText: doc.altText,
    sortOrder: doc.sortOrder,
    width: doc.width,
    height: doc.height,
    publicUrl: options.publicUrl ?? null,
    confirmedAt: doc.confirmedAt.toISOString() as ImageResponse['confirmedAt'],
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}
