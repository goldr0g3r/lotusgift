import type { PostHog } from 'posthog-node';

import { createServerFlagClient } from './server.js';

class StubPostHog {
  isEnabledCalls = 0;
  getFlagCalls = 0;
  shutdownCalled = 0;
  isEnabledReturn: boolean | undefined = true;
  getFlagReturn: string | boolean | undefined = 'variant-a';

  async isFeatureEnabled() {
    this.isEnabledCalls += 1;
    return this.isEnabledReturn;
  }

  async getFeatureFlag() {
    this.getFlagCalls += 1;
    return this.getFlagReturn;
  }

  async shutdown() {
    this.shutdownCalled += 1;
  }
}

function build(stub: StubPostHog, cacheTtlMs = 60_000) {
  return createServerFlagClient({
    apiKey: 'unused-in-tests',
    client: stub as unknown as PostHog,
    cacheTtlMs,
  });
}

describe('createServerFlagClient', () => {
  it('caches a boolean flag within the TTL window', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    const a = await flags.isEnabled('checkout-v2', { distinctId: 'u1' });
    const b = await flags.isEnabled('checkout-v2', { distinctId: 'u1' });
    expect(a).toBe(true);
    expect(b).toBe(true);
    expect(stub.isEnabledCalls).toBe(1);
  });

  it('distinct distinctIds yield separate cache entries', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    await flags.isEnabled('checkout-v2', { distinctId: 'u1' });
    await flags.isEnabled('checkout-v2', { distinctId: 'u2' });
    expect(stub.isEnabledCalls).toBe(2);
  });

  it('distinct propertyHashes yield separate cache entries', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    await flags.isEnabled('checkout-v2', {
      distinctId: 'u1',
      personProperties: { tier: 'pro' },
    });
    await flags.isEnabled('checkout-v2', {
      distinctId: 'u1',
      personProperties: { tier: 'free' },
    });
    expect(stub.isEnabledCalls).toBe(2);
  });

  it('clearCache forces a re-fetch', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    await flags.isEnabled('checkout-v2', { distinctId: 'u1' });
    flags.clearCache();
    await flags.isEnabled('checkout-v2', { distinctId: 'u1' });
    expect(stub.isEnabledCalls).toBe(2);
  });

  it('returns false when flag is undefined upstream', async () => {
    const stub = new StubPostHog();
    stub.isEnabledReturn = undefined;
    const flags = build(stub);
    expect(await flags.isEnabled('unknown-flag', { distinctId: 'u1' })).toBe(false);
  });

  it('variant() caches multivariate values', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    const v1 = await flags.variant('hero-experiment', { distinctId: 'u1' });
    const v2 = await flags.variant('hero-experiment', { distinctId: 'u1' });
    expect(v1).toBe('variant-a');
    expect(v2).toBe('variant-a');
    expect(stub.getFlagCalls).toBe(1);
  });

  it('shutdown delegates to underlying client', async () => {
    const stub = new StubPostHog();
    const flags = build(stub);
    await flags.shutdown();
    expect(stub.shutdownCalled).toBe(1);
  });
});
