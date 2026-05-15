import type { Env } from '@repo/config';

import { sendMsg91Otp } from './msg91.js';

function stubEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'test',
    PORT: 3001,
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/lotusgift-test',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-test',
    BETTER_AUTH_URL: 'http://localhost:3001',
    FRONTEND_URL: 'http://localhost:3000',
    OTEL_SERVICE_NAME: 'lotusgift-test',
    OUTBOX_POLL_INTERVAL_MS: 250,
    ...overrides,
  } as unknown as Env;
}

describe('sendMsg91Otp', () => {
  const realFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('skips delivery when ALL MSG91_* env vars are unset in dev/test', async () => {
    const fetchSpy = jest.fn();
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;
    await sendMsg91Otp(stubEnv(), '+919999999999', '123456');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('throws when only some MSG91_* env vars are set (partial config)', async () => {
    await expect(
      sendMsg91Otp(
        stubEnv({ MSG91_AUTH_KEY: 'auth-key' } as Partial<Env>),
        '+919999999999',
        '123456',
      ),
    ).rejects.toThrow(/MSG91 misconfigured.*missing MSG91_TEMPLATE_ID.*MSG91_SENDER_ID/);
  });

  it('throws in production when MSG91_* vars are unset (fail-fast)', async () => {
    await expect(
      sendMsg91Otp(
        stubEnv({ NODE_ENV: 'production' } as Partial<Env>),
        '+919999999999',
        '123456',
      ),
    ).rejects.toThrow(/MSG91 misconfigured.*all MSG91_\* vars unset in production/);
  });

  it('POSTs to MSG91 v5 endpoint with authkey header when keys are set', async () => {
    const fetchSpy = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => '{"type":"success"}',
    });
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    await sendMsg91Otp(
      stubEnv({
        MSG91_AUTH_KEY: 'auth-key',
        MSG91_TEMPLATE_ID: 'tmpl_123',
        MSG91_SENDER_ID: 'LOTUSG',
      } as Partial<Env>),
      '+919876543210',
      '123456',
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://control.msg91.com/api/v5/otp');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.authkey).toBe('auth-key');
    expect(headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body).toEqual({
      template_id: 'tmpl_123',
      mobile: '919876543210',
      otp: '123456',
      sender: 'LOTUSG',
    });
  });

  it('throws a descriptive error when MSG91 responds with non-2xx', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'bad authkey',
    }) as unknown as typeof globalThis.fetch;

    await expect(
      sendMsg91Otp(
        stubEnv({
          MSG91_AUTH_KEY: 'bad',
          MSG91_TEMPLATE_ID: 'tmpl_123',
          MSG91_SENDER_ID: 'LOTUSG',
        } as Partial<Env>),
        '+919999999999',
        '123456',
      ),
    ).rejects.toThrow(/MSG91 send-OTP failed.*HTTP 401 Unauthorized — bad authkey/);
  });
});
