import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT } from '@repo/utils';

import { SnapshotUpdaterService } from './snapshot-updater.service.js';
import { STOCK_LEDGER_MODEL, STOCK_SNAPSHOT_MODEL } from '../schemas/index.js';

describe('SnapshotUpdaterService', () => {
  it('applies ledger delta to snapshot on appended event', async () => {
    const updateOne = jest.fn().mockReturnValue({ exec: () => Promise.resolve() });
    const ledgerFindOne = jest.fn().mockResolvedValue({
      id: 'led-1',
      ledgerSeq: 2,
      actorId: 'actor-1',
    });
    const snapshotFindOne = jest.fn().mockReturnValue({
      exec: () =>
        Promise.resolve({
          id: 'snap-1',
          lastSnapshotLedgerSeq: 1,
        }),
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        SnapshotUpdaterService,
        {
          provide: getModelToken(STOCK_SNAPSHOT_MODEL),
          useValue: { findOne: snapshotFindOne, updateOne },
        },
        {
          provide: getModelToken(STOCK_LEDGER_MODEL),
          useValue: { findOne: () => ({ exec: ledgerFindOne }) },
        },
        { provide: OUTBOX_PORT, useValue: { subscribe: jest.fn() } },
      ],
    }).compile();

    const service = moduleRef.get(SnapshotUpdaterService);
    await service.handleAppended({
      orgId: 'o1',
      vendorId: 'v1',
      warehouseId: 'w1',
      variantId: 'var-1',
      ledgerEntryId: 'led-1',
      delta: 3,
      reason: 'RECEIVED',
      newOnHand: 13,
    });
    expect(updateOne).toHaveBeenCalled();
  });
});
