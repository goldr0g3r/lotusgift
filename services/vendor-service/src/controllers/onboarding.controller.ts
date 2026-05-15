import { BadRequestException, Body, Controller, Get, Post, Query } from '@nestjs/common';

import { OnboardingRequestSchema, type OnboardingStatusResponse } from '@repo/validators';

import { CurrentUser, Session, type CurrentUserPayload, type SessionPayload } from '../session.types.js';
import { OnboardingService } from '../services/onboarding.service.js';

interface OnboardingStartResponse {
  vendorId: string;
  status: OnboardingStatusResponse;
}

@Controller('vendors/onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  /**
   * Start (or resume) onboarding for the user's active org. Idempotent
   * — repeated POSTs return the existing DRAFT vendor.
   */
  @Post('start')
  async start(
    @Session() session: SessionPayload,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<OnboardingStartResponse> {
    const orgId = session.activeOrganizationId;
    if (!orgId) {
      throw new BadRequestException({
        message: 'Active vendor organization required to start onboarding',
        code: 'VALIDATION_FAILED',
      });
    }
    return this.onboardingService.start({ orgId, startedBy: user.id });
  }

  /**
   * Apply a single wizard step. Body shape:
   *
   *   { step: 'BASIC'|'KYC'|..., payload: <step-specific payload> }
   */
  @Post()
  async applyStep(
    @Session() session: SessionPayload,
    @CurrentUser() user: CurrentUserPayload,
    @Body() raw: unknown,
  ): Promise<OnboardingStatusResponse> {
    const orgId = session.activeOrganizationId;
    if (!orgId) {
      throw new BadRequestException({
        message: 'Active vendor organization required',
        code: 'VALIDATION_FAILED',
      });
    }
    const parsed = OnboardingRequestSchema.parse(raw);
    // Look up the vendor associated with the org (created by /start).
    const startResult = await this.onboardingService.start({ orgId, startedBy: user.id });
    return this.onboardingService.applyStep({
      vendorId: startResult.vendorId,
      step: parsed.step,
      payload: parsed.payload,
      actorId: user.id,
    });
  }

  @Get('status')
  async getStatus(
    @Session() session: SessionPayload,
    @CurrentUser() user: CurrentUserPayload,
    @Query('vendorId') vendorIdQuery?: string,
  ): Promise<OnboardingStatusResponse> {
    const orgId = session.activeOrganizationId;
    if (!orgId) {
      throw new BadRequestException({
        message: 'Active vendor organization required',
        code: 'VALIDATION_FAILED',
      });
    }
    let vendorId = vendorIdQuery;
    if (!vendorId) {
      const start = await this.onboardingService.start({ orgId, startedBy: user.id });
      vendorId = start.vendorId;
    }
    return this.onboardingService.getStatus(vendorId);
  }
}
