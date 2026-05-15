import {
  VendorActivatedV1,
  VendorKycSubmittedV1,
  VendorOnboardingStartedV1,
  VendorTierUpgradedV1,
  VendorWarehouseAddedV1,
} from './index.js';

const FIXED_ULID = '01JAB23456789ABCDEFGHJKMNQ';

function baseEnvelope() {
  return {
    __schemaVersion: '1.0',
    idempotencyKey: 'vendor:test:event:1',
    eventId: FIXED_ULID,
    occurredAt: '2026-05-15T10:00:00.000Z',
  };
}

describe('vendor.onboarding-started.v1', () => {
  it('has the canonical event name', () => {
    expect(VendorOnboardingStartedV1.name).toBe('vendor.onboarding-started.v1');
  });

  it('parses a valid envelope', () => {
    const result = VendorOnboardingStartedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.onboarding-started.v1',
      payload: { orgId: FIXED_ULID, vendorId: FIXED_ULID, startedBy: FIXED_ULID },
    });
    expect(result.type).toBe('vendor.onboarding-started.v1');
  });
});

describe('vendor.kyc-submitted.v1', () => {
  it('has the canonical event name', () => {
    expect(VendorKycSubmittedV1.name).toBe('vendor.kyc-submitted.v1');
  });

  it('parses a valid envelope', () => {
    const result = VendorKycSubmittedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.kyc-submitted.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        kycSubmissionId: FIXED_ULID,
        gstin: '27AAPFU0939F1ZV',
        panEntityKind: 'F',
      },
    });
    expect(result.payload.gstin).toBe('27AAPFU0939F1ZV');
  });
});

describe('vendor.activated.v1', () => {
  it('parses a valid envelope', () => {
    const result = VendorActivatedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.activated.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        approvedBy: FIXED_ULID,
        activatedAt: '2026-05-15T10:00:00.000Z',
      },
    });
    expect(result.type).toBe('vendor.activated.v1');
  });
});

describe('vendor.warehouse-added.v1', () => {
  it('parses a valid envelope with a known IN state', () => {
    const result = VendorWarehouseAddedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.warehouse-added.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        warehouseId: FIXED_ULID,
        state: 'IN-KA',
        pincode: '560001',
      },
    });
    expect(result.payload.state).toBe('IN-KA');
    expect(result.payload.pincode).toBe('560001');
  });

  it('rejects an unknown state code', () => {
    const result = VendorWarehouseAddedV1.schema.safeParse({
      ...baseEnvelope(),
      type: 'vendor.warehouse-added.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        warehouseId: FIXED_ULID,
        state: 'IN-XX',
        pincode: '560001',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('vendor.tier-upgraded.v1', () => {
  it('parses a fromTier = null (initial assignment)', () => {
    const result = VendorTierUpgradedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.tier-upgraded.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        fromTier: null,
        toTier: 'STARTER',
        effectiveAt: '2026-05-15T10:00:00.000Z',
      },
    });
    expect(result.payload.fromTier).toBeNull();
    expect(result.payload.toTier).toBe('STARTER');
  });

  it('parses a STARTER -> GROWTH upgrade', () => {
    const result = VendorTierUpgradedV1.schema.parse({
      ...baseEnvelope(),
      type: 'vendor.tier-upgraded.v1',
      payload: {
        orgId: FIXED_ULID,
        vendorId: FIXED_ULID,
        fromTier: 'STARTER',
        toTier: 'GROWTH',
        effectiveAt: '2026-05-15T10:00:00.000Z',
      },
    });
    expect(result.payload.fromTier).toBe('STARTER');
    expect(result.payload.toTier).toBe('GROWTH');
  });
});
