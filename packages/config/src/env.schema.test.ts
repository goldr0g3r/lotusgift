import { ConfigValidationError, loadEnv } from './load-env.js';

describe('loadEnv', () => {
  it('accepts a minimal dev env and applies defaults', () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
    expect(env.LOG_LEVEL).toBe('info');
    expect(env.MONGODB_URI).toMatch(/^mongodb:\/\/localhost/);
    expect(env.OUTBOX_POLL_INTERVAL_MS).toBe(250);
  });

  it('coerces numeric strings for PORT + OUTBOX_POLL_INTERVAL_MS', () => {
    const env = loadEnv({ PORT: '4000', OUTBOX_POLL_INTERVAL_MS: '500' });
    expect(env.PORT).toBe(4000);
    expect(env.OUTBOX_POLL_INTERVAL_MS).toBe(500);
  });

  it('accepts a full production env when all required keys are present', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      MONGODB_URI: 'mongodb+srv://user:pass@prod.mongodb.net/lotusgift',
      BETTER_AUTH_SECRET: 'a-32-character-or-longer-prod-secret',
      BETTER_AUTH_URL: 'https://api.lotusgift.com',
      FRONTEND_URL: 'https://lotusgift.com',
      OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp-gateway-prod-ap-south-1.grafana.net/otlp',
      // OSM Nominatim policy requires an identifying User-Agent in prod
      // — see env.schema.ts superRefine. Sentinel default is rejected.
      NOMINATIM_USER_AGENT: 'lotusgift-prod ops@lotusgift.com',
    });
    expect(env.NODE_ENV).toBe('production');
    expect(env.NOMINATIM_BASE_URL).toMatch(/^https:\/\//);
  });

  it('rejects production env that leaves NOMINATIM_USER_AGENT at the dev default', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://prod/lotusgift',
        BETTER_AUTH_SECRET: 'a-32-character-or-longer-prod-secret',
        BETTER_AUTH_URL: 'https://api.lotusgift.com',
        FRONTEND_URL: 'https://lotusgift.com',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example/otlp',
      }),
    ).toThrow(/NOMINATIM_USER_AGENT/);
  });

  it('rejects production env with dev-default BETTER_AUTH_SECRET', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://prod/lotusgift',
        BETTER_AUTH_URL: 'https://api.lotusgift.com',
        FRONTEND_URL: 'https://lotusgift.com',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'https://otlp.example/otlp',
      }),
    ).toThrow(ConfigValidationError);
  });

  it('rejects production env without OTEL endpoint', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        MONGODB_URI: 'mongodb+srv://prod/lotusgift',
        BETTER_AUTH_SECRET: 'a-32-character-or-longer-prod-secret',
        BETTER_AUTH_URL: 'https://api.lotusgift.com',
        FRONTEND_URL: 'https://lotusgift.com',
      }),
    ).toThrow(/OTEL_EXPORTER_OTLP_ENDPOINT/);
  });

  it('rejects malformed Mongo URI', () => {
    expect(() => loadEnv({ MONGODB_URI: 'not-a-mongo-uri' })).toThrow(ConfigValidationError);
  });

  it('rejects PORT outside 1..65535', () => {
    expect(() => loadEnv({ PORT: '70000' })).toThrow(ConfigValidationError);
  });

  it('ConfigValidationError aggregates every failing issue', () => {
    try {
      loadEnv({
        NODE_ENV: 'production',
        PORT: '99999',
        MONGODB_URI: 'bogus',
      });
      fail('expected loadEnv to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      const issues = (err as ConfigValidationError).issues;
      expect(issues.length).toBeGreaterThan(1);
    }
  });
});
