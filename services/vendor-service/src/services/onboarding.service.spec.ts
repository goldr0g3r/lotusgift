import { Test, type TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { OnboardingService } from './onboarding.service.js';
import { KycService } from './kyc.service.js';
import { WarehouseService } from './warehouse.service.js';
import { TierService } from './tier.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';
import { VENDOR_MODEL } from '../schemas/vendor.schema.js';

describe('OnboardingService.nextExpectedStep (pure)', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    const fakeModel = {
      findOne: jest.fn().mockReturnValue({ exec: () => Promise.resolve(null) }),
      create: jest.fn(),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: getModelToken(VENDOR_MODEL), useValue: fakeModel },
        { provide: KycService, useValue: {} as KycService },
        { provide: WarehouseService, useValue: {} as WarehouseService },
        { provide: TierService, useValue: {} as TierService },
        {
          provide: OUTBOX_PORT,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) } as unknown as OutboxPort,
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(OnboardingService);
  });

  it('returns BASIC for an empty completedSteps array', () => {
    expect(service.nextExpectedStep([])).toBe('BASIC');
  });

  it('returns KYC after BASIC completes', () => {
    expect(service.nextExpectedStep(['BASIC'])).toBe('KYC');
  });

  it('returns BANK after BASIC + KYC', () => {
    expect(service.nextExpectedStep(['BASIC', 'KYC'])).toBe('BANK');
  });

  it('returns WAREHOUSES after BASIC + KYC + BANK', () => {
    expect(service.nextExpectedStep(['BASIC', 'KYC', 'BANK'])).toBe('WAREHOUSES');
  });

  it('returns TIER after BASIC + KYC + BANK + WAREHOUSES', () => {
    expect(service.nextExpectedStep(['BASIC', 'KYC', 'BANK', 'WAREHOUSES'])).toBe('TIER');
  });

  it('returns SUBMITTED_FOR_REVIEW after all 5 wizard steps complete', () => {
    expect(
      service.nextExpectedStep(['BASIC', 'KYC', 'BANK', 'WAREHOUSES', 'TIER']),
    ).toBe('SUBMITTED_FOR_REVIEW');
  });

  it('returns null once all 6 steps (including submission) are done', () => {
    expect(
      service.nextExpectedStep([
        'BASIC',
        'KYC',
        'BANK',
        'WAREHOUSES',
        'TIER',
        'SUBMITTED_FOR_REVIEW',
      ]),
    ).toBeNull();
  });

  it('refuses skip-ahead: completed=[BASIC] requires KYC next, not BANK', () => {
    expect(service.nextExpectedStep(['BASIC'])).not.toBe('BANK');
  });
});
