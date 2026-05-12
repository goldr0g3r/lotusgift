import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { BetterAuthGuard } from './better-auth.guard';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: BetterAuthGuard,
    },
  ],
  exports: [],
})
export class AuthModule {}
