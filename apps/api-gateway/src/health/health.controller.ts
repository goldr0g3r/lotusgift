import { Controller, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Connection } from 'mongoose';

import { recordHealth } from '@repo/observability';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(@InjectConnection() private readonly db: Connection) {}

  @Get('healthz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Lightweight liveness check — returns 200 OK as long as the Node process is responsive. Does NOT probe downstream dependencies. Used by Docker HEALTHCHECK + Oracle systemd watchdog.',
  })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  liveness(): { status: 'ok'; uptimeSec: number; timestamp: string } {
    recordHealth({ scope: 'liveness', status: 1 });
    return {
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readyz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Probes downstream dependencies (currently: MongoDB connection state). Returns 503 if any probe is unhealthy. Used by load balancers + readiness gates.',
  })
  @ApiResponse({ status: 200, description: 'All probes healthy' })
  @ApiResponse({ status: 503, description: 'At least one probe unhealthy' })
  async readiness(): Promise<{
    status: 'ok' | 'degraded';
    probes: { mongo: boolean };
    timestamp: string;
  }> {
    // mongoose.ConnectionState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    const mongoConnected = this.db.readyState === 1;
    recordHealth({ scope: 'readiness', status: mongoConnected ? 1 : 0, probe: 'mongo' });
    if (!mongoConnected) {
      // Throw so the GlobalProblemDetailsFilter renders the RFC 9457
      // envelope with code = UPSTREAM_UNAVAILABLE.
      throw Object.assign(new Error('Mongo connection not ready'), {
        getStatus: () => 503,
        getResponse: () => ({
          message: 'Mongo connection not ready',
          code: 'UPSTREAM_UNAVAILABLE',
        }),
      });
    }
    return {
      status: 'ok',
      probes: { mongo: mongoConnected },
      timestamp: new Date().toISOString(),
    };
  }
}
