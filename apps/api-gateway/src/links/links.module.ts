import { Module } from '@nestjs/common';

import { LinksService } from './links.service.js';
import { LinksController } from './links.controller.js';

@Module({
  controllers: [LinksController],
  providers: [LinksService],
})
export class LinksModule {}
