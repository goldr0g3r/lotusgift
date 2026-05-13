import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  status: 'ok';
  uptimeSec: number;
  timestamp: string;
}

@Controller()
export class HealthController {
  // Liveness probe used by:
  //   - Docker HEALTHCHECK in apps/api-gateway/Dockerfile
  //   - nginx upstream check (infrastructure/oracle/nginx/sites-available/api.lotusgift.com.conf)
  //   - infrastructure/oracle/scripts/heartbeat.sh (Oracle idle-reclaim mitigation)
  //   - .github/workflows/deploy-oracle.yml verify job
  //
  // Liveness only — does NOT check downstream dependencies (Mongo, Redis, etc.).
  // A dedicated /readyz that does those checks lands at P4 alongside the real
  // api-gateway shell.
  @Get('healthz')
  liveness(): HealthResponse {
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
