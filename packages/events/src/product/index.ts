// Per-service event schemas for `services/product-service` (P7 —
// populates the empty P2 shell). 7 v1 events covering the product +
// variant lifecycle (variant-updated + variant-removed added in the
// PR-17 Copilot review iteration so the search-index snapshot rebuilds
// on every variant mutation per `event-driven-discipline.mdc`).

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
  VendorProductVariantUpdatedV1,
  type VendorProductVariantUpdatedV1Payload,
} from './variant-updated.v1.js';

export {
  VendorProductVariantRemovedV1,
  type VendorProductVariantRemovedV1Payload,
} from './variant-removed.v1.js';

export {
  VendorProductImageConfirmedV1,
  type VendorProductImageConfirmedV1Payload,
} from './image-confirmed.v1.js';

export {
  VendorProductReviewApprovedV1,
  type VendorProductReviewApprovedV1Payload,
} from './review-approved.v1.js';
