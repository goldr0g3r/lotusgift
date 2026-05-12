import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from './auth/public.decorator';

@Public()
@ApiTags('Health')
@Controller()
export class AppController {
  @Get()
  healthCheck() {
    return { status: 'ok', name: 'Lotus Gift API' };
  }
}
