import { retry } from './retry.js';

describe('retry', () => {
  it('succeeds on the first attempt without retrying', async () => {
    const fn = jest.fn(async () => 'ok');
    const result = await retry(fn, { attempts: 3, baseDelayMs: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until the fn succeeds', async () => {
    let calls = 0;
    const fn = jest.fn(async () => {
      calls += 1;
      if (calls < 3) throw new Error(`fail ${calls}`);
      return 'recovered';
    });
    const result = await retry(fn, { attempts: 5, baseDelayMs: 1 });
    expect(result).toBe('recovered');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws the last error after exhausting attempts', async () => {
    const fn = jest.fn(async () => {
      throw new Error('always fails');
    });
    await expect(retry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops early when shouldRetry returns false', async () => {
    const fn = jest.fn(async () => {
      throw new Error('non-retryable');
    });
    await expect(
      retry(fn, {
        attempts: 5,
        baseDelayMs: 1,
        shouldRetry: () => false,
      }),
    ).rejects.toThrow('non-retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('honours AbortSignal between attempts', async () => {
    const controller = new AbortController();
    const fn = jest.fn(async () => {
      controller.abort();
      throw new Error('transient');
    });
    await expect(
      retry(fn, { attempts: 5, baseDelayMs: 50, signal: controller.signal }),
    ).rejects.toThrow(/aborted/);
  });
});
