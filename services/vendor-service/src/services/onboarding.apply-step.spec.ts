import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { OnboardingService } from './onboarding.service.js';
import { KycService } from './kyc.service.js';
import { WarehouseService } from './warehouse.service.js';
import { TierService } from './tier.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';
import { VENDOR_MODEL } from '../schemas/vendor.schema.js';

/**
 * Integration-shape tests for `OnboardingService.applyStep` (not just
 * the pure `nextExpectedStep` helper). Stubs the Mongo model + the
 * downstream Kyc/Warehouse/Tier services so we can assert the
 * state-machine rejects backward + skip transitions deterministically.
 */
describe('OnboardingService.applyStep state machine', () => {
  let service: OnboardingService;
  const vendorDoc = {
    id: 'v-1',
    orgId: 'org-1',
    status: 'DRAFT',
    tier: 'STARTER',
    onboardingState: { completedSteps: [] as string[] },
    displayName: '',
    contactEmail: '',
    contactPhone: '',
    save: jest.fn().mockResolvedValue(undefined),
    updatedBy: null as string | null,
  };

  beforeEach(async () => {
    vendorDoc.onboardingState = { completedSteps: [] };
    vendorDoc.save.mockClear();

    const fakeModel = {
      findOne: (_filter: unknown) => ({
        exec: () => Promise.resolve(vendorDoc),
      }),
      create: jest.fn().mockResolvedValue([vendorDoc]),
    };
    const fakeConnection = {
      startSession: () =>
        Promise.resolve({
          withTransaction: async (fn: () => Promise<unknown>) => fn(),
          endSession: () => Promise.resolve(),
        }),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: getModelToken(VENDOR_MODEL), useValue: fakeModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        { provide: KycService, useValue: { submit: jest.fn() } as unknown as KycService },
        {
          provide: WarehouseService,
          useValue: { create: jest.fn() } as unknown as WarehouseService,
        },
        {
          provide: TierService,
          useValue: { changeTier: jest.fn() } as unknown as TierService,
        },
        {
          provide: OUTBOX_PORT,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) } as unknown as OutboxPort,
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(OnboardingService);
  });

  it('rejects skipping ahead from BASIC straight to BANK', async () => {
    await expect(
      service.applyStep({
        vendorId: 'v-1',
        step: 'BANK',
        payload: { bankAccount: {} },
        actorId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects going backward from KYC back to BASIC', async () => {
    vendorDoc.onboardingState = { completedSteps: ['BASIC', 'KYC'] };
    await expect(
      service.applyStep({
        vendorId: 'v-1',
        step: 'BASIC',
        payload: { displayName: 'X', contactEmail: 'a@b.com', contactPhone: '+919999999999' },
        actorId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts the next-expected step (forward progression)', async () => {
    const result = await service.applyStep({
      vendorId: 'v-1',
      step: 'BASIC',
      payload: {
        displayName: 'Acme Trading',
        contactEmail: 'ops@acme.com',
        contactPhone: '+919876543210',
      },
      actorId: 'user-1',
    });
    expect(result.completedSteps).toContain('BASIC');
    expect(vendorDoc.save).toHaveBeenCalled();
  });

  it('rejects applying a step on a non-DRAFT vendor', async () => {
    (vendorDoc as unknown as { status: string }).status = 'ACTIVATED';
    await expect(
      service.applyStep({
        vendorId: 'v-1',
        step: 'BASIC',
        payload: {
          displayName: 'X',
          contactEmail: 'x@x.com',
          contactPhone: '+919999999999',
        },
        actorId: 'user-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    (vendorDoc as unknown as { status: string }).status = 'DRAFT';
  });
});
