import { Test } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { UnprocessableEntityException } from '@nestjs/common';

import { OUTBOX_PORT } from '@repo/utils';

import { LedgerService } from './ledger.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN, ENV_TOKEN } from '../inventory-service.tokens.js';
import { STOCK_LEDGER_MODEL, STOCK_SNAPSHOT_MODEL } from '../schemas/index.js';

const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('LedgerService.append', () => {
  const outboxPublish = jest.fn().mockResolvedValue(undefined);
  let ledgerCreate: jest.Mock;
  let snapshotFindOne: jest.Mock;
  let snapshotUpdateOne: jest.Mock;
  let service: LedgerService;

  beforeEach(async () => {
    outboxPublish.mockClear();
    ledgerCreate = jest.fn().mockResolvedValue([
      {
        id: 'led-1',
        variantId: 'var-1',
        warehouseId: 'wh-1',
        ledgerSeq: 1,
        delta: 5,
        reason: 'RECEIVED',
      },
    ]);
    snapshotFindOne = jest.fn().mockResolvedValue({
      id: 'snap-1',
      onHand: 10,
      lowStockThreshold: 10,
      reorderPoint: 5,
      reorderQty: 50,
    });
    snapshotUpdateOne = jest.fn().mockReturnValue({ exec: () => Promise.resolve() });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LedgerService,
        {
          provide: getModelToken(STOCK_LEDGER_MODEL),
          useValue: {
            create: ledgerCreate,
            findOne: () => ({ sort: () => ({ session: () => ({ exec: () => Promise.resolve(null) }) }) }),
          },
        },
        {
          provide: getModelToken(STOCK_SNAPSHOT_MODEL),
          useValue: {
            findOne: jest.fn().mockReturnValue({
              session: () => ({ exec: snapshotFindOne }),
              exec: snapshotFindOne,
            }),
            updateOne: snapshotUpdateOne,
            create: jest.fn().mockResolvedValue([{ id: 'snap-new', onHand: 0 }]),
          },
        },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: OUTBOX_PORT, useValue: { publish: outboxPublish } },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
        { provide: ENV_TOKEN, useValue: {} },
      ],
    }).compile();
    service = moduleRef.get(LedgerService);
  });

  it('appends ledger + publishes stock-ledger-appended (happy path)', async () => {
    await service.append({
      variantId: 'var-1',
      warehouseId: 'wh-1',
      orgId: 'org-1',
      vendorId: 'ven-1',
      delta: 5,
      reason: 'RECEIVED',
      actorId: 'actor-1',
    });
    expect(ledgerCreate).toHaveBeenCalled();
    expect(outboxPublish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'inventory.stock-ledger-appended.v1' }),
      expect.objectContaining({ session: expect.anything() }),
    );
  });

  it('propagates outbox publish failure (unhappy path)', async () => {
    outboxPublish.mockRejectedValueOnce(new Error('outbox down'));
    await expect(
      service.append({
        variantId: 'var-1',
        warehouseId: 'wh-1',
        orgId: 'org-1',
        vendorId: 'ven-1',
        delta: 1,
        reason: 'RECEIVED',
        actorId: 'actor-1',
      }),
    ).rejects.toThrow('outbox down');
    expect(outboxPublish).toHaveBeenCalled();
  });

  it('rejects negative on-hand', async () => {
    snapshotFindOne.mockResolvedValue({ id: 'snap-1', onHand: 2 });
    await expect(
      service.append({
        variantId: 'var-1',
        warehouseId: 'wh-1',
        orgId: 'org-1',
        vendorId: 'ven-1',
        delta: -5,
        reason: 'ORDER_DECREMENTED',
        actorId: 'actor-1',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
