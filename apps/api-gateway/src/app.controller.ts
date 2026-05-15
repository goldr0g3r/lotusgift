import { Controller, Get } from '@nestjs/common';

import { AllowAnonymous } from '@lotusgift/auth-service';

import { AppService } from './app.service.js';

@AllowAnonymous()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
