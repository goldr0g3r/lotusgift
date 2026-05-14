import { Module } from '@nestjs/common';

import { AuthMountStubController } from './auth.controller.js';

/**
 * Auth module STUB. Real Better-Auth setup (BetterAuthModule from
 * `@thallesp/nestjs-better-auth` + Mongo adapter + email/password +
 * passkey + 2FA + Google social + organization plugin) lands at P5.
 */
@Module({
  controllers: [AuthMountStubController],
})
export class AuthModule {}
