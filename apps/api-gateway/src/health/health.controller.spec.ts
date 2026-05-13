import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
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
});
