import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@Roles('admin')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(): Promise<any> {
    return this.dashboardService.getStats();
  }
}
