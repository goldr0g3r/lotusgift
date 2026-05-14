import { All, Controller, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

/**
 * Better-Auth mount-point STUB. The real instance is wired in P5
 * (`services/auth-service`) — it'll register a Better-Auth handler via
 * `toNodeHandler(auth)` mounted BEFORE Nest's body parser, replacing
 * this stub controller.
 *
 * Until then, every `/api/auth/*` request returns 503 Service
 * Unavailable so consumers see a clear "not wired yet" signal instead
 * of a 404 or a hang.
 *
 * Excluded from Swagger UI (`@ApiExcludeController`) — Better-Auth
 * handles its own OpenAPI doc generation when P5 wires it.
 */
@ApiExcludeController()
@Controller('auth')
export class AuthMountStubController {
  @All('*path')
  notImplementedYet(_req: Request, res: Response): void {
    res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      type: 'about:blank',
      title: 'Auth service not wired',
      status: HttpStatus.SERVICE_UNAVAILABLE,
      detail:
        'Better-Auth mount-point is reserved at /api/auth/* but the auth ' +
        'service has not been wired yet (lands at P5). See ' +
        'docs/research/phase-4-api-gateway.md decision D1.',
      code: 'UPSTREAM_UNAVAILABLE',
    });
  }
}
