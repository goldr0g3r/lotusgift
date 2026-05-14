import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  let controller: HealthController;
  let connectionStub: { readyState: number };

  beforeEach(async () => {
    connectionStub = { readyState: 1 };
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: getConnectionToken(), useValue: connectionStub }],
    }).compile();
    controller = moduleRef.get<HealthController>(HealthController);
  });

  it('returns status=ok with a numeric uptime and ISO timestamp', () => {
    const result = controller.liveness();
    expect(result.status).toBe('ok');
    expect(typeof result.uptimeSec).toBe('number');
    expect(result.uptimeSec).toBeGreaterThanOrEqual(0);
    expect(() => new Date(result.timestamp)).not.toThrow();
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });

  it('readiness returns ok when Mongo is connected', async () => {
    connectionStub.readyState = 1;
    const result = await controller.readiness();
    expect(result.status).toBe('ok');
    expect(result.probes.mongo).toBe(true);
  });

  it('readiness throws when Mongo is disconnected', async () => {
    connectionStub.readyState = 0;
    await expect(controller.readiness()).rejects.toThrow(/Mongo connection not ready/);
  });
});
