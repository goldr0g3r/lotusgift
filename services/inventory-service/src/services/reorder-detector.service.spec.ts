import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT } from '@repo/utils';

import { ReorderDetectorService } from './reorder-detector.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN } from '../inventory-service.tokens.js';
import { STOCK_SNAPSHOT_MODEL } from '../schemas/index.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('ReorderDetectorService', () => {
  it('emits reorder-needed for low snapshots', async () => {
    const publish = jest.fn().mockResolvedValue(undefined);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ReorderDetectorService,
        {
          provide: getModelToken(STOCK_SNAPSHOT_MODEL),
          useValue: {
            find: () => ({
              limit: () => ({
                exec: () =>
                  Promise.resolve([
                    {
                      orgId: 'o1',
                      vendorId: 'ven-1',
                      warehouseId: 'w1',
                      variantId: 'var-1',
                      onHand: 2,
                      reorderPoint: 5,
                      reorderQty: 50,
                    },
                  ]),
              }),
            }),
          },
        },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish } },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    await moduleRef.get(ReorderDetectorService).detectDaily();
    expect(publish).toHaveBeenCalled();
  });
});
