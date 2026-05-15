import { Test, type TestingModule } from '@nestjs/testing';

import type { Env } from '@repo/config';

import { AuthServiceModule } from './auth-service.module.js';
import { AUTH_INSTANCE, AUTH_MONGO_CLIENT } from './auth.tokens.js';
import { ENV_TOKEN_NAME } from './env.token.js';
import type { BetterAuthInstance } from './build-better-auth-instance.js';

/**
 * Module-compile smoke test. Substitutes the two async providers
 * (AUTH_MONGO_CLIENT + AUTH_INSTANCE) with stubs so we don't open a
 * real Mongo connection or pull in the ESM-only better-auth runtime.
 *
 * The substitution path mirrors what the api-gateway integration test
 * at P16 will do — once the Playwright suite lands, this becomes the
 * inner-loop fast-feedback check.
 */
describe('AuthServiceModule', () => {
  let moduleRef: TestingModule;
  const closeSpy = jest.fn().mockResolvedValue(undefined);

  beforeAll(async () => {
    const env: Env = {
      NODE_ENV: 'test',
      PORT: 3001,
      LOG_LEVEL: 'silent',
      MONGODB_URI: 'mongodb://localhost:27017/lotusgift-test',
      BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test',
      BETTER_AUTH_URL: 'http://localhost:3001',
      FRONTEND_URL: 'http://localhost:3000',
      OTEL_SERVICE_NAME: 'lotusgift-test',
      OUTBOX_POLL_INTERVAL_MS: 250,
    } as unknown as Env;

    const stubMongoClient = { close: closeSpy };
    const stubAuth: BetterAuthInstance = {
      handler: async () => new Response('ok'),
      api: { getSession: async (): Promise<unknown> => null },
    };

    moduleRef = await Test.createTestingModule({
      imports: [AuthServiceModule],
      providers: [{ provide: ENV_TOKEN_NAME, useValue: env }],
    })
      .overrideProvider(AUTH_MONGO_CLIENT)
      .useValue(stubMongoClient)
      .overrideProvider(AUTH_INSTANCE)
      .useValue(stubAuth)
      .compile();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  it('resolves AUTH_INSTANCE through the overridden provider', () => {
    const auth = moduleRef.get<BetterAuthInstance>(AUTH_INSTANCE);
    expect(typeof auth.handler).toBe('function');
    expect(typeof auth.api.getSession).toBe('function');
  });

  it('resolves AUTH_MONGO_CLIENT through the overridden provider', () => {
    const client = moduleRef.get<{ close: () => Promise<void> }>(AUTH_MONGO_CLIENT);
    expect(typeof client.close).toBe('function');
  });

  it('closes the MongoClient on application shutdown', async () => {
    const moduleInstance = moduleRef.get(AuthServiceModule);
    await moduleInstance.onApplicationShutdown('SIGTERM');
    expect(closeSpy).toHaveBeenCalled();
  });
});
