import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT } from '@repo/utils';
import { WarehouseService } from '@lotusgift/vendor-service';

import { TransferService } from './transfer.service.js';
import { LedgerService } from './ledger.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN } from '../inventory-service.tokens.js';
import { TRANSFER_MODEL } from '../schemas/index.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('TransferService', () => {
  it('rejects transfer when warehouse missing', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransferService,
        { provide: getModelToken(TRANSFER_MODEL), useValue: { create: jest.fn() } },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: jest.fn() } },
        {
          provide: WarehouseService,
          useValue: { findById: jest.fn().mockResolvedValue(null) },
        },
        { provide: LedgerService, useValue: { append: jest.fn() } },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    const service = moduleRef.get(TransferService);
    await expect(
      service.transfer({
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        variantId: 'v1',
        qty: 1,
        reasonNote: 'test',
        actorId: 'admin',
      }),
    ).rejects.toThrow();
  });
});
