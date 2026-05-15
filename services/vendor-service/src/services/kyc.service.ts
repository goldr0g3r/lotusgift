import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

import {
  assertGstinChecksumValid,
  BankAccountSchema,
  GstinIndiaSchema,
  IfscSchema,
  PanEntityKindSchema,
  PanSchema,
  UpiVpaSchema,
  type BankAccount,
} from '@repo/validators';
import { ulid, type OutboxPort, OUTBOX_PORT } from '@repo/utils';
import { withTransaction } from '@repo/database';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import { VendorKycSubmittedV1 } from '@repo/events';
import type { PanEntityKind } from '@repo/types';

import {
  KYC_SUBMISSION_MODEL,
  type KycSubmissionDocument,
} from '../schemas/kyc-submission.schema.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';

/**
 * Input shape accepted by `KycService.submit`. The Zod schemas
 * referenced here are re-validated at the service-layer boundary so
 * service consumers (onboarding service, internal admin tools) get the
 * same checksum + format guarantees as REST callers.
 */
export interface KycSubmissionInput {
  vendorId: string;
  orgId: string;
  gstin: string;
  pan: string;
  entityKind: PanEntityKind;
  bankAccount: BankAccount;
  upiVpa?: string;
  supportingDocsR2Keys?: string[];
  actorId: string;
}

/**
 * Pure validator surface — exposed separately so the onboarding service
 * (per-step partial validation) + the warehouse-service tests can poke
 * at the individual format checks without instantiating the full Mongo
 * stack.
 */
export interface KycValidationResult {
  ok: boolean;
  errors: Array<{ field: string; message: string }>;
}

@Injectable()
export class KycService {
  constructor(
    @InjectModel(KYC_SUBMISSION_MODEL)
    private readonly kycModel: Model<KycSubmissionDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  /**
   * Run every KYC format / checksum check without persisting. Returns
   * an aggregated result so admin tools can surface the full error list
   * in one round-trip.
   */
  validate(input: Omit<KycSubmissionInput, 'vendorId' | 'orgId' | 'actorId'>): KycValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    const gstinResult = GstinIndiaSchema.safeParse(input.gstin);
    if (!gstinResult.success) {
      errors.push({ field: 'gstin', message: 'Invalid GSTIN format' });
    } else if (!assertGstinChecksumValid(gstinResult.data)) {
      errors.push({ field: 'gstin', message: 'GSTIN checksum (15th char) does not match' });
    }

    const panResult = PanSchema.safeParse(input.pan);
    if (!panResult.success) {
      errors.push({ field: 'pan', message: 'Invalid PAN format' });
    } else if (input.entityKind && panResult.data.charAt(3) !== input.entityKind) {
      errors.push({
        field: 'pan',
        message: `PAN 4th char (${panResult.data.charAt(3)}) must match entityKind (${input.entityKind})`,
      });
    }

    const entityKindResult = PanEntityKindSchema.safeParse(input.entityKind);
    if (!entityKindResult.success) {
      errors.push({ field: 'entityKind', message: 'Invalid PAN entity-kind code' });
    }

    const bankResult = BankAccountSchema.safeParse(input.bankAccount);
    if (!bankResult.success) {
      const issue = bankResult.error.issues[0];
      errors.push({
        field: 'bankAccount',
        message: issue ? issue.message : 'Invalid bank account details',
      });
    } else {
      const ifscResult = IfscSchema.safeParse(bankResult.data.ifsc);
      if (!ifscResult.success) {
        errors.push({ field: 'bankAccount.ifsc', message: 'Invalid IFSC' });
      }
    }

    if (input.upiVpa !== undefined) {
      const upiResult = UpiVpaSchema.safeParse(input.upiVpa);
      if (!upiResult.success) {
        errors.push({ field: 'upiVpa', message: 'Invalid UPI VPA' });
      }
    }

    return { ok: errors.length === 0, errors };
  }

  /**
   * Persist a KYC submission row (`PENDING` status) + emit
   * `vendor.kyc-submitted.v1`. Throws BadRequestException if validation
   * fails; the global ProblemDetails filter renders the response.
   */
  async submit(input: KycSubmissionInput): Promise<KycSubmissionDocument> {
    const validation = this.validate(input);
    if (!validation.ok) {
      throw new BadRequestException({
        message: 'KYC validation failed',
        code: 'VALIDATION_FAILED',
        errors: validation.errors,
      });
    }

    // Atomic dual-write — kyc submission row + outbox event commit
    // together per `.cursor/rules/event-driven-discipline.mdc`.
    const docId = ulid();
    let created!: KycSubmissionDocument;
    await withTransaction(this.connection, async (session) => {
      const docs = await this.kycModel.create(
        [
          {
            id: docId,
            vendorId: input.vendorId,
            orgId: input.orgId,
            gstin: input.gstin.toUpperCase(),
            pan: input.pan.toUpperCase(),
            entityKind: input.entityKind,
            bankSnapshot: {
              accountNumber: input.bankAccount.accountNumber,
              ifsc: input.bankAccount.ifsc.toUpperCase(),
              holderName: input.bankAccount.holderName,
              accountType: input.bankAccount.accountType,
              upiVpa: input.upiVpa ?? null,
            },
            supportingDocsR2Keys: input.supportingDocsR2Keys ?? [],
            status: 'PENDING',
            createdBy: input.actorId,
          },
        ],
        { session },
      );
      created = docs[0] as KycSubmissionDocument;
      await this.outbox.publish(
        {
          type: VendorKycSubmittedV1.name,
          idempotencyKey: `vendor:${input.vendorId}:kyc-submitted:${docId}`,
          payload: {
            orgId: input.orgId,
            vendorId: input.vendorId,
            kycSubmissionId: docId,
            gstin: input.gstin.toUpperCase(),
            panEntityKind: input.entityKind,
          },
        },
        { session },
      );
    });

    // Analytics AFTER outbox commit — failed transactions never
    // ghost-emit downstream PostHog events (D18).
    this.analytics.capture({
      distinctId: input.actorId,
      event: 'vendor kyc-submitted',
      properties: {
        vendor_id: input.vendorId,
        org_id: input.orgId,
        kyc_submission_id: docId,
        entity_kind: input.entityKind,
      },
    });

    return created;
  }
}
