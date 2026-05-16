import { ulid } from '@repo/utils';

import {
  InventoryDeadStockDetectedV1,
  InventoryLowStockDetectedV1,
  InventoryReorderNeededV1,
  InventoryReservationCreatedV1,
  InventoryReservationExpiredV1,
  InventoryReservationExtendedV1,
  InventoryStockLedgerAppendedV1,
  InventoryTransferredV1,
} from './index.js';

describe('inventory events', () => {
  const baseEnvelope = (type: string) => ({
    __schemaVersion: '1.0',
    type,
    idempotencyKey: 'inventory:evt:1',
    eventId: ulid(),
    occurredAt: new Date().toISOString(),
  });

  const ids = () => ({
    orgId: ulid(),
    vendorId: ulid(),
    warehouseId: ulid(),
    variantId: ulid(),
  });

  it('inventory.stock-ledger-appended.v1 round-trip', () => {
    const parsed = InventoryStockLedgerAppendedV1.schema.parse({
      ...baseEnvelope('inventory.stock-ledger-appended.v1'),
      payload: {
        ...ids(),
        ledgerEntryId: ulid(),
        delta: -2,
        reason: 'ORDER_DECREMENTED',
        newOnHand: 8,
      },
    });
    expect(parsed.type).toBe('inventory.stock-ledger-appended.v1');
  });

  it('inventory.low-stock-detected.v1 round-trip', () => {
    const parsed = InventoryLowStockDetectedV1.schema.parse({
      ...baseEnvelope('inventory.low-stock-detected.v1'),
      payload: {
        ...ids(),
        onHand: 3,
        threshold: 10,
        detectedAt: new Date().toISOString(),
      },
    });
    expect(parsed.payload.onHand).toBe(3);
  });

  it('inventory.dead-stock-detected.v1 round-trip', () => {
    const parsed = InventoryDeadStockDetectedV1.schema.parse({
      ...baseEnvelope('inventory.dead-stock-detected.v1'),
      payload: {
        ...ids(),
        onHand: 5,
        daysSinceLastMovement: 90,
        detectedAt: new Date().toISOString(),
      },
    });
    expect(parsed.payload.daysSinceLastMovement).toBe(90);
  });

  it('inventory.reorder-needed.v1 round-trip', () => {
    const parsed = InventoryReorderNeededV1.schema.parse({
      ...baseEnvelope('inventory.reorder-needed.v1'),
      payload: {
        ...ids(),
        onHand: 2,
        reorderPoint: 5,
        suggestedOrderQty: 50,
        detectedAt: new Date().toISOString(),
      },
    });
    expect(parsed.payload.suggestedOrderQty).toBe(50);
  });

  it('inventory.transferred.v1 round-trip', () => {
    const parsed = InventoryTransferredV1.schema.parse({
      ...baseEnvelope('inventory.transferred.v1'),
      payload: {
        orgId: ulid(),
        vendorId: ulid(),
        fromWarehouseId: ulid(),
        toWarehouseId: ulid(),
        variantId: ulid(),
        qty: 10,
        transferId: ulid(),
        reasonNote: 'rebalance',
      },
    });
    expect(parsed.payload.reasonNote).toBe('rebalance');
  });

  it('inventory.reservation-created.v1 round-trip', () => {
    const parsed = InventoryReservationCreatedV1.schema.parse({
      ...baseEnvelope('inventory.reservation-created.v1'),
      payload: {
        ...ids(),
        reservationId: ulid(),
        qty: 2,
        ttlSec: 900,
        idempotencyKey: 'cart-1',
      },
    });
    expect(parsed.payload.ttlSec).toBe(900);
  });

  it('inventory.reservation-extended.v1 round-trip', () => {
    const parsed = InventoryReservationExtendedV1.schema.parse({
      ...baseEnvelope('inventory.reservation-extended.v1'),
      payload: {
        ...ids(),
        reservationId: ulid(),
        newTtlSec: 900,
        extensionCount: 1,
      },
    });
    expect(parsed.payload.extensionCount).toBe(1);
  });

  it('inventory.reservation-expired.v1 round-trip', () => {
    const parsed = InventoryReservationExpiredV1.schema.parse({
      ...baseEnvelope('inventory.reservation-expired.v1'),
      payload: {
        ...ids(),
        reservationId: ulid(),
        qty: 1,
        idempotencyKey: 'cart-1',
      },
    });
    expect(parsed.type).toBe('inventory.reservation-expired.v1');
  });
});
