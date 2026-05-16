import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, StubReservationPort } from '@repo/utils';

import { WarehouseService } from '@lotusgift/vendor-service';

import { ReservationService } from './reservation.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN, ENV_TOKEN, RESERVATION_PORT } from '../inventory-service.tokens.js';
import { RESERVATION_AUDIT_MODEL } from '../schemas/index.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('ReservationService', () => {
  it('creates reservation + audit row (happy path)', async () => {
    const auditCreate = jest.fn().mockResolvedValue({
      reservationId: 'res-1',
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 2,
      status: 'PENDING',
      ttlExpiresAt: new Date(),
      idempotencyKey: 'idem-1',
    });
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReservationService,
        { provide: RESERVATION_PORT, useClass: StubReservationPort },
        { provide: OUTBOX_PORT, useValue: { publish: jest.fn().mockResolvedValue(undefined) } },
        { provide: getModelToken(RESERVATION_AUDIT_MODEL), useValue: { create: auditCreate } },
        { provide: getConnectionToken(), useValue: fakeConnection },
        {
          provide: WarehouseService,
          useValue: {
            findById: () => Promise.resolve({ orgId: 'org-1', vendorId: 'ven-1' }),
          },
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
        { provide: ENV_TOKEN, useValue: {} },
      ],
    }).compile();

    const service = moduleRef.get(ReservationService);
    await service.create({
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 2,
      idempotencyKey: 'idem-1',
      actorId: 'user-1',
    });
    expect(auditCreate).toHaveBeenCalled();
  });
});
