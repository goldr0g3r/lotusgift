import { currentTraceId, traceId, withTraceId } from './trace-id.js';

describe('traceId', () => {
  it('prefixes the value with trc_', () => {
    const t = traceId();
    expect(t.startsWith('trc_')).toBe(true);
    expect(t.length).toBe(4 + 26);
  });
});

describe('withTraceId + currentTraceId', () => {
  it('returns undefined outside an active scope', () => {
    expect(currentTraceId()).toBeUndefined();
  });

  it('reads the active id inside a scope', () => {
    withTraceId('trc_test', () => {
      expect(currentTraceId()).toBe('trc_test');
    });
  });

  it('isolates scopes between async-parallel calls', async () => {
    const captured: Array<string | undefined> = [];
    await Promise.all([
      new Promise<void>((resolve) => {
        withTraceId('trc_a', async () => {
          await new Promise((r) => setTimeout(r, 10));
          captured.push(currentTraceId());
          resolve();
        });
      }),
      new Promise<void>((resolve) => {
        withTraceId('trc_b', async () => {
          await new Promise((r) => setTimeout(r, 5));
          captured.push(currentTraceId());
          resolve();
        });
      }),
    ]);
    expect(captured.sort()).toEqual(['trc_a', 'trc_b']);
  });
});
