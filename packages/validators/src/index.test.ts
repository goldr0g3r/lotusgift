import {
  AuditMetaSchema,
  CursorPaginatedSchema,
  CursorSchema,
  CustomizationStatusSchema,
  OrderStatusSchema,
  OrgKindSchema,
  PageMetaSchema,
  PageQuerySchema,
  PaginatedSchema,
  PaymentStatusSchema,
  RecipientListUploadStatusSchema,
  RfqStatusSchema,
  ShipmentStatusSchema,
  UserRoleSchema,
  z,
} from './index.js';

describe('enum schemas', () => {
  it('parses every valid OrgKind', () => {
    expect(OrgKindSchema.parse('vendor-org')).toBe('vendor-org');
    expect(OrgKindSchema.parse('corporate-buyer-org')).toBe('corporate-buyer-org');
    expect(OrgKindSchema.parse('internal-staff-org')).toBe('internal-staff-org');
  });

  it('rejects unknown OrgKind values', () => {
    expect(() => OrgKindSchema.parse('admin-org')).toThrow();
  });

  it('parses every UserRole', () => {
    for (const role of [
      'owner',
      'admin',
      'member',
      'warehouse-manager',
      'inventory-manager',
      'finance',
      'customer-service',
    ]) {
      expect(UserRoleSchema.parse(role)).toBe(role);
    }
  });

  it('parses every OrderStatus', () => {
    for (const status of [
      'draft',
      'placed',
      'partially_fulfilled',
      'fulfilled',
      'cancelled',
      'refunded',
    ]) {
      expect(OrderStatusSchema.parse(status)).toBe(status);
    }
  });

  it('parses every ShipmentStatus', () => {
    for (const status of [
      'pending',
      'picked',
      'in_transit',
      'out_for_delivery',
      'delivered',
      'rto_in_transit',
      'rto_delivered',
      'cancelled',
    ]) {
      expect(ShipmentStatusSchema.parse(status)).toBe(status);
    }
  });

  it('parses every PaymentStatus', () => {
    for (const status of [
      'pending',
      'authorized',
      'captured',
      'failed',
      'refunded',
      'partially_refunded',
    ]) {
      expect(PaymentStatusSchema.parse(status)).toBe(status);
    }
  });

  it('parses every RfqStatus', () => {
    for (const status of [
      'draft',
      'sent',
      'negotiating',
      'accepted',
      'rejected',
      'expired',
    ]) {
      expect(RfqStatusSchema.parse(status)).toBe(status);
    }
  });

  it('parses every CustomizationStatus (state machine per corporate-gifting rule)', () => {
    for (const status of [
      'draft',
      'art_uploaded',
      'mockup_pending',
      'mockup_delivered',
      'approved',
      'rejected',
      'in_production',
    ]) {
      expect(CustomizationStatusSchema.parse(status)).toBe(status);
    }
  });

  it('parses every RecipientListUploadStatus', () => {
    for (const status of [
      'pending',
      'validating',
      'validated',
      'rejected',
      'order_created',
      'order_failed',
    ]) {
      expect(RecipientListUploadStatusSchema.parse(status)).toBe(status);
    }
  });
});

describe('pagination schemas', () => {
  it('PageQuerySchema defaults page=1, limit=20, order=desc', () => {
    const parsed = PageQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
    expect(parsed.order).toBe('desc');
  });

  it('PageQuerySchema coerces string numbers', () => {
    const parsed = PageQuerySchema.parse({ page: '3', limit: '50' });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it('PageQuerySchema enforces max limit of 100', () => {
    expect(() => PageQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it('PageMetaSchema validates a complete page-meta object', () => {
    const parsed = PageMetaSchema.parse({
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
    });
    expect(parsed.totalPages).toBe(5);
  });

  it('CursorSchema accepts a base64-ish opaque string', () => {
    expect(CursorSchema.parse({ value: 'abc123' }).value).toBe('abc123');
  });

  it('PaginatedSchema factory wraps an item schema', () => {
    const PaginatedStrings = PaginatedSchema(z.string());
    const parsed = PaginatedStrings.parse({
      items: ['a', 'b'],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    expect(parsed.items).toEqual(['a', 'b']);
  });

  it('CursorPaginatedSchema factory accepts nextCursor: null', () => {
    const Paged = CursorPaginatedSchema(z.string());
    const parsed = Paged.parse({ items: ['a'], nextCursor: null });
    expect(parsed.nextCursor).toBeNull();
  });
});

describe('AuditMetaSchema', () => {
  it('accepts a complete audit-meta', () => {
    const parsed = AuditMetaSchema.parse({
      createdAt: '2026-05-14T10:30:00Z',
      updatedAt: '2026-05-14T10:35:00Z',
      createdBy: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      updatedBy: 'system',
    });
    expect(parsed.updatedBy).toBe('system');
  });

  it('accepts audit-meta without createdBy/updatedBy', () => {
    const parsed = AuditMetaSchema.parse({
      createdAt: '2026-05-14T10:30:00Z',
      updatedAt: '2026-05-14T10:35:00Z',
    });
    expect(parsed.createdBy).toBeUndefined();
  });
});
