import { Module } from '@nestjs/common';

import { LinksModule } from './links/links.module.js';

import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { HealthController } from './health/health.controller.js';

@Module({
  imports: [LinksModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
