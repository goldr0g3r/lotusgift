// Per-service event schemas for `services/product-service` (P7 —
// populates the empty P2 shell). 5 v1 events covering the product
// lifecycle.

export {
  VendorProductPublishedV1,
  type VendorProductPublishedV1Payload,
} from './published.v1.js';

export {
  VendorProductUnpublishedV1,
  type VendorProductUnpublishedV1Payload,
} from './unpublished.v1.js';

export {
  VendorProductVariantAddedV1,
  type VendorProductVariantAddedV1Payload,
} from './variant-added.v1.js';

export {
  VendorProductImageConfirmedV1,
  type VendorProductImageConfirmedV1Payload,
} from './image-confirmed.v1.js';

export {
  VendorProductReviewApprovedV1,
  type VendorProductReviewApprovedV1Payload,
} from './review-approved.v1.js';
