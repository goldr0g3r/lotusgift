import type { VendorDocument } from '../../schemas/vendor.schema.js';

/**
 * Project a `VendorDocument` to the public `VendorProfileResponse`
 * shape. Strips Mongo internals + commission overrides (admin-only;
 * exposed via a separate endpoint when needed).
 */
export function mapVendorToResponse(vendor: VendorDocument): {
  id: string;
  orgId: string;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  status: string;
  tier: string;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
} {
  return {
    id: vendor.id as unknown as string,
    orgId: vendor.orgId,
    displayName: vendor.displayName,
    contactEmail: vendor.contactEmail,
    contactPhone: vendor.contactPhone,
    status: vendor.status,
    tier: vendor.tier,
    activatedAt: vendor.activatedAt ? vendor.activatedAt.toISOString() : null,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
  };
}
