import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { RESERVATION_PORT, StubReservationPort } from '@repo/utils';
import { STOCK_SNAPSHOT_MODEL } from '../schemas/index.js';
import { AvailabilityService } from './availability.service.js';

describe('AvailabilityService', () => {
  it('batchGetByWarehouse groups rows per variant', async () => {
    const find = jest.fn().mockReturnValue({
      exec: () =>
        Promise.resolve([
          {
            variantId: 'var-1',
            warehouseId: 'w1',
            orgId: 'o1',
            vendorId: 'ven-1',
            onHand: 5,
            reservedCount: 1,
            lowStockThreshold: 10,
            reorderPoint: 5,
            reorderQty: 50,
            pendingLedgerCount: 0,
            lastMovementAt: new Date('2026-05-16T00:00:00.000Z'),
            updatedAt: new Date('2026-05-16T00:00:00.000Z'),
          },
        ]),
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getConnectionToken(), useValue: { db: undefined } },
        { provide: RESERVATION_PORT, useClass: StubReservationPort },
        { provide: getModelToken(STOCK_SNAPSHOT_MODEL), useValue: { find: find } },
      ],
    }).compile();
    const service = moduleRef.get(AvailabilityService);
    const result = await service.batchGetByWarehouse(['var-1']);
    expect(result['var-1']).toHaveLength(1);
    expect(result['var-1']?.[0]?.available).toBe(4);
  });
});
