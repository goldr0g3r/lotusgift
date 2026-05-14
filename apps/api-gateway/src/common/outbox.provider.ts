import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Logger,
  type Provider,
} from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

import { InProcessOutboxPort, OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import type { Env } from '@repo/config';

import { ENV_TOKEN } from './config.tokens.js';

const logger = new Logger('OutboxPort');

/**
 * NestJS lifecycle wrapper around the framework-agnostic
 * `InProcessOutboxPort`. Wires:
 *   - `OnApplicationBootstrap` → `port.start()` (begins the poll loop).
 *   - `OnApplicationShutdown` → `await port.stop()` (drains in-flight
 *     ticks; safe to call during hot reload + tests).
 */
@Injectable()
export class OutboxLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
  constructor(@Inject(OUTBOX_PORT) private readonly port: OutboxPort) {}

  onApplicationBootstrap(): void {
    this.port.start();
    logger.log('OutboxPort started');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.port.stop();
    logger.log('OutboxPort stopped');
  }
}

export const OUTBOX_PROVIDER: Provider = {
  provide: OUTBOX_PORT,
  useFactory: (connection: Connection, env: Env): OutboxPort => {
    return new InProcessOutboxPort(connection, {
      pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
      log: (message, meta) => {
        logger.log(meta ? `${message} ${JSON.stringify(meta)}` : message);
      },
    });
  },
  inject: [getConnectionToken(), ENV_TOKEN],
};
