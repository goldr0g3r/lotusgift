export interface RetryOptions {
  /** Maximum attempts (including the first try). Default 3. */
  attempts?: number;
  /** Base delay in ms for backoff. Default 100. */
  baseDelayMs?: number;
  /** Cap on backoff delay. Default 10_000 (10s). */
  maxDelayMs?: number;
  /** Optional abort signal to cancel in-flight + future attempts. */
  signal?: AbortSignal;
  /**
   * Predicate that returns `true` when an error should be retried.
   * Default: retry every error.
   */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

/**
 * Retry an async function with exponential backoff + full jitter
 * (`Math.random() * Math.min(maxDelay, baseDelay * 2^attempt)`). Full
 * jitter reduces thundering-herd risk vs. fixed-interval retries.
 *
 * Honours `AbortSignal` cancellation between attempts (in-flight calls
 * are NOT cancelled; rely on the wrapped fn's own signal handling).
 *
 * Throws the last attempt's error with the original `cause` chain
 * preserved.
 *
 * @example
 * ```ts
 * await retry(() => fetch(url), { attempts: 5, baseDelayMs: 200, signal });
 * ```
 */
export async function retry<TResult>(
  fn: () => Promise<TResult>,
  opts: RetryOptions = {},
): Promise<TResult> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 100;
  const maxDelayMs = opts.maxDelayMs ?? 10_000;
  const shouldRetry = opts.shouldRetry ?? (() => true);
  const signal = opts.signal;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (signal?.aborted) {
      throw new Error('retry aborted', { cause: signal.reason });
    }
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt === attempts || !shouldRetry(err, attempt)) {
        throw err;
      }
      const cap = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      const delay = Math.floor(Math.random() * cap);
      await sleep(delay, signal);
    }
  }

  // Unreachable in practice — the loop always either returns or throws.
  throw lastError;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('retry aborted', { cause: signal?.reason }));
    };
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        reject(new Error('retry aborted', { cause: signal.reason }));
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}
