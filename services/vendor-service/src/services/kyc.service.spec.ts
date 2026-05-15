import { Test, type TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';

import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';

import { KycService } from './kyc.service.js';
import { NO_OP_ANALYTICS } from './analytics.helper.js';
import { KYC_SUBMISSION_MODEL } from '../schemas/kyc-submission.schema.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';
import {
  assertGstinChecksumValid,
  computeGstinCheckChar,
} from '@repo/validators';

/**
 * Stub Mongoose connection — `withTransaction` calls `connection.startSession()`
 * then `session.withTransaction(fn)`. The stub immediately invokes the
 * callback (no actual transaction) so tests can run without a real
 * Mongo instance.
 */
const fakeConnection = {
  startSession: () =>
    Promise.resolve({
      withTransaction: async (fn: () => Promise<unknown>) => fn(),
      endSession: () => Promise.resolve(),
    }),
};

describe('KycService.validate', () => {
  let service: KycService;
  const outboxPublish = jest.fn().mockResolvedValue(undefined);
  const fakeModel = {
    create: jest
      .fn()
      .mockImplementation((docs: unknown[]) =>
        Promise.resolve(Array.isArray(docs) ? docs : [docs]),
      ),
  };

  beforeEach(async () => {
    outboxPublish.mockClear();
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        KycService,
        { provide: getModelToken(KYC_SUBMISSION_MODEL), useValue: fakeModel },
        { provide: getConnectionToken(), useValue: fakeConnection },
        {
          provide: OUTBOX_PORT,
          useValue: { publish: outboxPublish } as unknown as OutboxPort,
        },
        { provide: ANALYTICS_TOKEN, useValue: NO_OP_ANALYTICS },
      ],
    }).compile();
    service = moduleRef.get(KycService);
  });

  it('passes a valid GSTIN with correct checksum + PAN with matching 4th-char', () => {
    const knownGoodPan = 'AAPFU0939F'; // F = firm/LLP, used by 27AAPFU0939F1ZV GSTIN
    const partial = '27AAPFU0939F1Z';
    const checkChar = computeGstinCheckChar(`${partial}A`);
    const validGstin = `${partial}${checkChar}`;
    expect(assertGstinChecksumValid(validGstin)).toBe(true);
    const result = service.validate({
      gstin: validGstin,
      pan: knownGoodPan,
      entityKind: 'F',
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN0125620',
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects a GSTIN whose checksum char is wrong', () => {
    const result = service.validate({
      gstin: '27AAPFU0939F1ZA', // valid format, wrong checksum
      pan: 'AAPFU0939F',
      entityKind: 'F',
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN0125620',
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'gstin')).toBe(true);
  });

  it('rejects when PAN 4th char does not match entityKind', () => {
    const partial = '27AAPFU0939F1Z';
    const checkChar = computeGstinCheckChar(`${partial}A`);
    const result = service.validate({
      gstin: `${partial}${checkChar}`,
      pan: 'AAPFU0939F',
      entityKind: 'P', // PAN says F (firm), input says P (individual)
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN0125620',
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'pan')).toBe(true);
  });

  it('rejects malformed IFSC (wrong 5th char)', () => {
    const result = service.validate({
      gstin: '27AAPFU0939F1Z5',
      pan: 'AAPFU0939F',
      entityKind: 'F',
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN1125620', // 5th char must be `0`
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some(
        (e) => e.field === 'bankAccount' || e.field === 'bankAccount.ifsc',
      ),
    ).toBe(true);
  });

  it('rejects a bank-account number outside 9..18 digit length', () => {
    const result = service.validate({
      gstin: '27AAPFU0939F1Z5',
      pan: 'AAPFU0939F',
      entityKind: 'F',
      bankAccount: {
        accountNumber: '1234567', // 7 digits — too short
        ifsc: 'SBIN0125620',
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'bankAccount')).toBe(true);
  });

  it('rejects a UPI VPA without @', () => {
    const result = service.validate({
      gstin: '27AAPFU0939F1Z5',
      pan: 'AAPFU0939F',
      entityKind: 'F',
      bankAccount: {
        accountNumber: '123456789012',
        ifsc: 'SBIN0125620',
        holderName: 'Acme Trading Co',
        accountType: 'current',
      },
      upiVpa: 'no-at-sign',
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.field === 'upiVpa')).toBe(true);
  });

  it('submit throws BadRequestException on validation failure', async () => {
    await expect(
      service.submit({
        vendorId: '01H123456789ABCDEFGHJKMNPQ',
        orgId: '01H123456789ABCDEFGHJKMNPQ',
        gstin: 'INVALID',
        pan: 'INVALID',
        entityKind: 'P',
        bankAccount: {
          accountNumber: '1',
          ifsc: 'XXXX0XXXXXX',
          holderName: 'X',
          accountType: 'savings',
        },
        actorId: '01H123456789ABCDEFGHJKMNPQ',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
