import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { TierUpgradeRequestSchema, type TierMatrixResponse } from '@repo/validators';

import { CurrentUser, type CurrentUserPayload } from '../session.types.js';
import { TierService } from '../services/tier.service.js';

@Controller()
export class TierController {
  constructor(private readonly tierService: TierService) {}

  @Get('vendor-tiers')
  listAvailableTiers(): TierMatrixResponse {
    return this.tierService.listAvailableTiers();
  }

  @Get('vendors/:id/tier')
  async getCurrent(@Param('id') id: string): Promise<{
    vendorId: string;
    tier: string;
    effectiveSince: string;
  }> {
    const result = await this.tierService.getCurrent(id);
    return {
      vendorId: id,
      tier: result.tier,
      effectiveSince: result.effectiveSince.toISOString(),
    };
  }

  @Post('vendors/:id/tier')
  async upgrade(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() raw: unknown,
  ): Promise<{
    vendorId: string;
    fromTier: string | null;
    toTier: string;
    effectiveAt: string;
  }> {
    const parsed = TierUpgradeRequestSchema.parse(raw);
    const result = await this.tierService.changeTier({
      vendorId: id,
      toTier: parsed.toTier,
      actorId: user.id,
    });
    return {
      vendorId: id,
      fromTier: result.fromTier,
      toTier: result.toTier,
      effectiveAt: result.effectiveAt.toISOString(),
    };
  }

  @Get('vendors/:id/commission-rate')
  async getCommission(
    @Param('id') id: string,
    @Query('categoryBucket') categoryBucket: string,
  ): Promise<{ vendorId: string; categoryBucket: string; ratePct: number }> {
    const ratePct = await this.tierService.resolveCommission(id, categoryBucket ?? 'other');
    return { vendorId: id, categoryBucket: categoryBucket ?? 'other', ratePct };
  }
}
