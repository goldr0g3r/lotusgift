import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { VendorService } from './vendor.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';
import { VENDOR_MODEL } from '../schemas/vendor.schema.js';

describe('VendorService.approve', () => {
  const findOne = jest.fn();
  const save = jest.fn();
  const outboxPublish = jest.fn().mockResolvedValue(undefined);

  let service: VendorService;

  beforeEach(async () => {
    findOne.mockReset();
    save.mockReset();
    outboxPublish.mockClear();

    const fakeModel = {
      findOne: (filter: unknown) =>
        ({
          exec: () => findOne(filter),
        }) as unknown as { exec: () => Promise<unknown> },
      countDocuments: jest.fn().mockResolvedValue(0),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        VendorService,
        { provide: getModelToken(VENDOR_MODEL), useValue: fakeModel },
        {
          provide: OUTBOX_PORT,
          useValue: { publish: outboxPublish } as unknown as OutboxPort,
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(VendorService);
  });

  it('throws NotFoundException when the vendor does not exist', async () => {
    findOne.mockResolvedValue(null);
    await expect(
      service.approve({ vendorId: 'missing', approvedBy: 'admin-1' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns existing vendor without re-emit when already ACTIVATED (idempotent)', async () => {
    findOne.mockResolvedValue({
      id: 'v1',
      orgId: 'o1',
      status: 'ACTIVATED',
      tier: 'STARTER',
      activatedAt: new Date('2026-01-01'),
      save,
    });
    const result = await service.approve({ vendorId: 'v1', approvedBy: 'admin-1' });
    expect(result.status).toBe('ACTIVATED');
    expect(outboxPublish).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('flips status to ACTIVATED + emits vendor.activated.v1 on first approval', async () => {
    const vendor = {
      id: 'v1',
      orgId: 'o1',
      status: 'PENDING_REVIEW',
      tier: 'STARTER',
      activatedAt: null as Date | null,
      updatedBy: null as string | null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    findOne.mockResolvedValue(vendor);
    await service.approve({ vendorId: 'v1', approvedBy: 'admin-1' });
    expect(vendor.status).toBe('ACTIVATED');
    expect(vendor.activatedAt).toBeInstanceOf(Date);
    expect(outboxPublish).toHaveBeenCalledTimes(1);
    const [eventArg] = outboxPublish.mock.calls[0] as [{ type: string; payload: unknown }];
    expect(eventArg.type).toBe('vendor.activated.v1');
    const payload = eventArg.payload as Record<string, unknown>;
    expect(payload.vendorId).toBe('v1');
    expect(payload.orgId).toBe('o1');
    expect(payload.approvedBy).toBe('admin-1');
  });
});
