import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ulid, type OutboxPort, OUTBOX_PORT } from '@repo/utils';
import { VendorOnboardingStartedV1 } from '@repo/events';
import type { ServerAnalytics } from '@repo/analytics-sdk';
import {
  BankStepSchema,
  KycStepSchema,
  TierStepSchema,
  VendorBasicStepSchema,
  WarehousesStepSchema,
  type OnboardingStep,
  type OnboardingStatusResponse,
} from '@repo/validators';

import { VENDOR_MODEL, type VendorDocument } from '../schemas/vendor.schema.js';
import { ANALYTICS_TOKEN } from '../vendor-service.tokens.js';
import { KycService } from './kyc.service.js';
import { TierService } from './tier.service.js';
import { WarehouseService } from './warehouse.service.js';

/**
 * Per-step linear state machine per D12. Forward transitions:
 * `BASIC -> KYC -> BANK -> WAREHOUSES -> TIER -> SUBMITTED_FOR_REVIEW`.
 * Backward transitions + skips reject with `INVALID_TRANSITION`.
 */
const STEP_ORDER: OnboardingStep[] = [
  'BASIC',
  'KYC',
  'BANK',
  'WAREHOUSES',
  'TIER',
  'SUBMITTED_FOR_REVIEW',
];

interface OnboardingState {
  completedSteps: OnboardingStep[];
  basic?: unknown;
  kyc?: unknown;
  bank?: unknown;
  warehouses?: unknown;
  tier?: unknown;
}

@Injectable()
export class OnboardingService {
  constructor(
    @InjectModel(VENDOR_MODEL) private readonly vendorModel: Model<VendorDocument>,
    private readonly kycService: KycService,
    private readonly warehouseService: WarehouseService,
    private readonly tierService: TierService,
    @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
    @Inject(ANALYTICS_TOKEN) private readonly analytics: ServerAnalytics,
  ) {}

  /**
   * Start a fresh onboarding wizard for the given Better-Auth org. Idempotent
   * — repeated calls return the existing `DRAFT` vendor if one already
   * exists for the org.
   */
  async start(args: {
    orgId: string;
    startedBy: string;
  }): Promise<{ vendorId: string; status: OnboardingStatusResponse }> {
    const existing = await this.vendorModel.findOne({ orgId: args.orgId }).exec();
    if (existing) {
      return {
        vendorId: existing.id as unknown as string,
        status: this.buildStatusResponse(existing),
      };
    }
    const vendorId = ulid();
    const created = await this.vendorModel.create({
      id: vendorId,
      orgId: args.orgId,
      displayName: '(pending)',
      contactEmail: 'pending@pending.invalid',
      contactPhone: '+910000000000',
      status: 'DRAFT',
      tier: 'STARTER',
      activatedAt: null,
      onboardingState: { completedSteps: [] } satisfies OnboardingState,
      createdBy: args.startedBy,
    });

    await this.outbox
      .publish(
        {
          type: VendorOnboardingStartedV1.name,
          idempotencyKey: `vendor:${vendorId}:onboarding-started:1`,
          payload: { orgId: args.orgId, vendorId, startedBy: args.startedBy },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { session: undefined as any },
      )
      .catch(() => {});

    this.analytics.capture({
      distinctId: args.startedBy,
      event: 'vendor onboarding-started',
      properties: { vendor_id: vendorId, org_id: args.orgId },
    });

    return { vendorId, status: this.buildStatusResponse(created as VendorDocument) };
  }

  /**
   * Apply a single wizard step. Enforces forward-only progression.
   */
  async applyStep(args: {
    vendorId: string;
    step: OnboardingStep;
    payload: unknown;
    actorId: string;
  }): Promise<OnboardingStatusResponse> {
    const vendor = await this.vendorModel.findOne({ id: args.vendorId }).exec();
    if (!vendor) {
      throw new BadRequestException({
        message: `Vendor ${args.vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    if (vendor.status !== 'DRAFT') {
      throw new BadRequestException({
        message: `Vendor ${args.vendorId} is not in DRAFT status; cannot apply onboarding step`,
        code: 'VALIDATION_FAILED',
      });
    }

    const raw: unknown = vendor.onboardingState ?? { completedSteps: [] };
    const state = raw as OnboardingState;
    const expectedStep = this.nextExpectedStep(state.completedSteps);
    if (expectedStep !== args.step) {
      throw new BadRequestException({
        message: `Invalid onboarding transition: expected step ${expectedStep}, got ${args.step}`,
        code: 'VALIDATION_FAILED',
        expectedStep,
        attemptedStep: args.step,
      });
    }

    const nextState = await this.runStep(vendor, state, args);
    nextState.completedSteps = [...state.completedSteps, args.step];

    if (args.step === 'SUBMITTED_FOR_REVIEW') {
      vendor.status = 'PENDING_REVIEW';
    }

    vendor.onboardingState = nextState as unknown as Record<string, unknown>;
    vendor.updatedBy = args.actorId;
    await vendor.save();

    return this.buildStatusResponse(vendor);
  }

  async getStatus(vendorId: string): Promise<OnboardingStatusResponse> {
    const vendor = await this.vendorModel.findOne({ id: vendorId }).exec();
    if (!vendor) {
      throw new BadRequestException({
        message: `Vendor ${vendorId} not found`,
        code: 'RESOURCE_NOT_FOUND',
      });
    }
    return this.buildStatusResponse(vendor);
  }

  /**
   * Pure helper exposed for tests: given the list of completed steps so
   * far, return the next allowed step. Returns `SUBMITTED_FOR_REVIEW`
   * once all 5 wizard steps complete; returns `null` once submitted.
   */
  nextExpectedStep(completedSteps: readonly OnboardingStep[]): OnboardingStep | null {
    for (const step of STEP_ORDER) {
      if (!completedSteps.includes(step)) return step;
    }
    return null;
  }

  private async runStep(
    vendor: VendorDocument,
    state: OnboardingState,
    args: { step: OnboardingStep; payload: unknown; actorId: string; vendorId: string },
  ): Promise<OnboardingState> {
    const next: OnboardingState = { ...state };
    switch (args.step) {
      case 'BASIC': {
        const data = VendorBasicStepSchema.parse(args.payload);
        vendor.displayName = data.displayName;
        vendor.contactEmail = data.contactEmail;
        vendor.contactPhone = data.contactPhone;
        next.basic = data;
        break;
      }
      case 'KYC': {
        const data = KycStepSchema.parse(args.payload);
        next.kyc = {
          gstin: data.gstin,
          pan: data.pan,
          entityKind: data.entityKind,
          supportingDocsR2Keys: data.supportingDocsR2Keys,
        };
        break;
      }
      case 'BANK': {
        const data = BankStepSchema.parse(args.payload);
        next.bank = data;
        // KYC submission happens at BANK step end so we have all the
        // pieces (GSTIN + PAN + bank). On submit failure the user can
        // re-enter BANK; we don't roll back KYC step.
        if (next.kyc) {
          const kycPayload = next.kyc as {
            gstin: string;
            pan: string;
            entityKind: import('@repo/types').PanEntityKind;
            supportingDocsR2Keys: string[];
          };
          await this.kycService.submit({
            vendorId: args.vendorId,
            orgId: vendor.orgId,
            gstin: kycPayload.gstin,
            pan: kycPayload.pan,
            entityKind: kycPayload.entityKind,
            bankAccount: data.bankAccount,
            upiVpa: data.upiVpa,
            supportingDocsR2Keys: kycPayload.supportingDocsR2Keys,
            actorId: args.actorId,
          });
        }
        break;
      }
      case 'WAREHOUSES': {
        const data = WarehousesStepSchema.parse(args.payload);
        for (const wh of data.warehouses) {
          await this.warehouseService.create({
            ...wh,
            vendorId: args.vendorId,
            actorId: args.actorId,
          });
        }
        next.warehouses = { count: data.warehouses.length };
        break;
      }
      case 'TIER': {
        const data = TierStepSchema.parse(args.payload);
        await this.tierService.changeTier({
          vendorId: args.vendorId,
          toTier: data.selectedTier,
          actorId: args.actorId,
        });
        next.tier = data;
        break;
      }
      case 'SUBMITTED_FOR_REVIEW': {
        // Marker step — flips the vendor status outside the switch.
        break;
      }
      default: {
        const exhaustive: never = args.step;
        throw new Error(`Unhandled onboarding step ${String(exhaustive)}`);
      }
    }
    return next;
  }

  private buildStatusResponse(vendor: VendorDocument): OnboardingStatusResponse {
    const raw: unknown = vendor.onboardingState ?? { completedSteps: [] };
    const state = raw as OnboardingState;
    const completed = state.completedSteps ?? [];
    const next = this.nextExpectedStep(completed);
    const percentComplete = Math.round((completed.length / STEP_ORDER.length) * 100);
    return {
      currentStep: next ?? 'SUBMITTED_FOR_REVIEW',
      completedSteps: completed,
      percentComplete,
      vendorId: vendor.id as unknown as string,
    };
  }
}
