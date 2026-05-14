import type { PostHog } from 'posthog-node';

import { createServerAnalytics } from './server.js';

class StubPostHog {
  captures: Array<{
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }> = [];
  identifies: Array<{ distinctId: string; properties?: Record<string, unknown> }> = [];
  flushed = 0;
  shutdownCalled = 0;

  capture(payload: {
    distinctId: string;
    event: string;
    properties?: Record<string, unknown>;
  }) {
    this.captures.push(payload);
  }

  identify(payload: { distinctId: string; properties?: Record<string, unknown> }) {
    this.identifies.push(payload);
  }

  async flush() {
    this.flushed += 1;
  }

  async shutdown() {
    this.shutdownCalled += 1;
  }
}

function build(stub: StubPostHog) {
  return createServerAnalytics({
    apiKey: 'unused-in-tests',
    client: stub as unknown as PostHog,
  });
}

describe('createServerAnalytics', () => {
  it('forwards capture to the underlying client with redaction applied', () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    analytics.capture({
      distinctId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      event: 'order placed',
      properties: {
        order_id: 'ord_1',
        body: { email: 'leak@example.com', gstin: 'leak' },
      },
    });
    expect(stub.captures).toHaveLength(1);
    const props = stub.captures[0]!.properties as { body: { email: string; gstin: string } };
    expect(props.body.email).toBe('[REDACTED]');
    expect(props.body.gstin).toBe('[REDACTED]');
    expect((stub.captures[0]!.properties as { order_id: string }).order_id).toBe('ord_1');
  });

  it('skips redaction when skipRedaction is true', () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    analytics.capture({
      distinctId: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
      event: 'pii whitelisted',
      properties: { body: { email: 'preserve@example.com' } },
      skipRedaction: true,
    });
    const props = stub.captures[0]!.properties as { body: { email: string } };
    expect(props.body.email).toBe('preserve@example.com');
  });

  it('rejects invalid distinctId', () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    expect(() =>
      analytics.capture({ distinctId: '', event: 'order placed' }),
    ).toThrow(/Invalid distinctId/);
    expect(() =>
      analytics.capture({ distinctId: 'undefined', event: 'order placed' }),
    ).toThrow(/Invalid distinctId/);
    expect(() =>
      analytics.capture({ distinctId: 'null', event: 'order placed' }),
    ).toThrow(/Invalid distinctId/);
  });

  it('rejects invalid event name', () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    expect(() =>
      analytics.capture({ distinctId: 'u1', event: 'orderPlaced' }),
    ).toThrow(/Invalid analytics event name/);
  });

  it('identify forwards + applies redaction', () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    analytics.identify({
      distinctId: 'u1',
      properties: { body: { phone: '+919876543210' }, signup_date: '2026-05-14' },
    });
    expect(stub.identifies).toHaveLength(1);
    const props = stub.identifies[0]!.properties as {
      body: { phone: string };
      signup_date: string;
    };
    expect(props.body.phone).toBe('[REDACTED]');
    expect(props.signup_date).toBe('2026-05-14');
  });

  it('flush + shutdown delegate to the underlying client', async () => {
    const stub = new StubPostHog();
    const analytics = build(stub);
    await analytics.flush();
    await analytics.shutdown();
    expect(stub.flushed).toBe(1);
    expect(stub.shutdownCalled).toBe(1);
  });
});
