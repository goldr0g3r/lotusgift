import { ulid } from '@repo/utils';

import {
  VendorProductImageConfirmedV1,
  VendorProductPublishedV1,
  VendorProductReviewApprovedV1,
  VendorProductUnpublishedV1,
  VendorProductVariantAddedV1,
} from './index.js';

/**
 * Round-trip tests for the 5 product event schemas. Asserts that a
 * minimal-but-valid envelope parses + the discriminator name aligns
 * with the published event constant. Mirrors the
 * `packages/events/src/vendor/events.test.ts` pattern from P6.
 */
describe('product events', () => {
  const baseEnvelope = (type: string) => ({
    __schemaVersion: '1.0',
    type,
    idempotencyKey: 'product:p1:event:1',
    eventId: ulid(),
    occurredAt: new Date().toISOString(),
  });

  it('product.published.v1 round-trip', () => {
    const parsed = VendorProductPublishedV1.schema.parse({
      ...baseEnvelope('product.published.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        slug: 'corporate-tea-gift-box-q7hx2',
        title: 'Corporate Tea Gift Box',
        categoryL1: 'gourmet-food',
        categoryL2: 'tea-set',
        occasions: ['holiday-festive', 'thank-you'],
      },
    });
    expect(parsed.type).toBe('product.published.v1');
    expect(parsed.payload.slug).toBe('corporate-tea-gift-box-q7hx2');
    expect(parsed.payload.occasions).toContain('thank-you');
  });

  it('product.unpublished.v1 round-trip with explicit reason', () => {
    const parsed = VendorProductUnpublishedV1.schema.parse({
      ...baseEnvelope('product.unpublished.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        reason: 'vendor-paused-restock',
      },
    });
    expect(parsed.payload.reason).toBe('vendor-paused-restock');
  });

  it('product.unpublished.v1 round-trip with null reason', () => {
    const parsed = VendorProductUnpublishedV1.schema.parse({
      ...baseEnvelope('product.unpublished.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        reason: null,
      },
    });
    expect(parsed.payload.reason).toBeNull();
  });

  it('product.variant-added.v1 round-trip', () => {
    const parsed = VendorProductVariantAddedV1.schema.parse({
      ...baseEnvelope('product.variant-added.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        variantId: ulid(),
        sku: 'TEABOX-BLACK-M',
        attributes: { color: 'Black', size: 'M' },
      },
    });
    expect(parsed.payload.sku).toBe('TEABOX-BLACK-M');
    expect(parsed.payload.attributes.color).toBe('Black');
  });

  it('product.image-confirmed.v1 round-trip', () => {
    const parsed = VendorProductImageConfirmedV1.schema.parse({
      ...baseEnvelope('product.image-confirmed.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        imageId: ulid(),
        r2Key: 'products/v1/p1/hero.jpg',
        kind: 'hero',
      },
    });
    expect(parsed.payload.kind).toBe('hero');
  });

  it('product.review-approved.v1 round-trip', () => {
    const parsed = VendorProductReviewApprovedV1.schema.parse({
      ...baseEnvelope('product.review-approved.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        productId: ulid(),
        reviewId: ulid(),
        rating: 5,
        approvedBy: ulid(),
        approvedAt: new Date().toISOString(),
      },
    });
    expect(parsed.payload.rating).toBe(5);
  });
});
