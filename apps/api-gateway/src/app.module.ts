import { Module } from '@nestjs/common';

import { LinksModule } from './links/links.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';
import { HealthController } from './health/health.controller';

@Module({
  imports: [LinksModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
