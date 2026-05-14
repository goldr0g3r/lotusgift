import posthog, { type PostHog } from 'posthog-js';

import { assertValidEventName } from './event-name.js';

export interface InitBrowserAnalyticsOptions {
  /** PostHog project API key (`NEXT_PUBLIC_POSTHOG_KEY`). */
  apiKey: string;
  /** PostHog Cloud host. Defaults to EU. */
  host?: string;
  /**
   * Current-best-practice defaults flag value per
   * https://posthog.com/docs/product-analytics/installation/web
   * (research note cite #7). 2026-01-30 enables sensible autocapture
   * + cookie defaults.
   */
  defaults?: string;
  /** Disable autocapture (manual `capture()` only). Default false. */
  disableAutocapture?: boolean;
}

let initialized = false;

/**
 * Initialize the PostHog browser SDK exactly once. Safe to call from
 * Next.js client component bootstrap; subsequent calls are no-ops.
 */
export function initBrowserAnalytics(opts: InitBrowserAnalyticsOptions): PostHog {
  if (initialized) return posthog;
  posthog.init(opts.apiKey, {
    api_host: opts.host ?? 'https://eu.i.posthog.com',
    // `defaults` is typed as a discriminated union of literal strings by
    // posthog-js. We accept arbitrary strings here so the LotusGift app
    // can roll forward to future defaults without bumping this package;
    // cast at the boundary.
    defaults: (opts.defaults ?? '2026-01-30') as unknown as Parameters<
      typeof posthog.init
    >[1] extends infer P
      ? P extends { defaults?: infer D }
        ? D
        : never
      : never,
    autocapture: !opts.disableAutocapture,
  });
  initialized = true;
  return posthog;
}

/**
 * Browser-side capture wrapper. Asserts the event-name format per the
 * rule. PII redaction is intentionally NOT applied client-side: PostHog
 * browser SDK runs in the user's browser, and any PII it sees came
 * from the user themselves. Server-side `capture()` enforces redaction
 * for system-emitted events.
 */
export function captureBrowser(event: string, properties?: Record<string, unknown>): void {
  assertValidEventName(event);
  if (!initialized) {
    throw new Error('initBrowserAnalytics() must be called before captureBrowser()');
  }
  posthog.capture(event, properties);
}

export function identifyBrowser(distinctId: string, properties?: Record<string, unknown>): void {
  if (!initialized) {
    throw new Error('initBrowserAnalytics() must be called before identifyBrowser()');
  }
  if (!distinctId || distinctId === 'undefined' || distinctId === 'null') {
    throw new Error(`Invalid distinctId "${distinctId}".`);
  }
  posthog.identify(distinctId, properties);
}

export { posthog as browserClient };
export { assertValidEventName, isValidEventName, InvalidEventNameError } from './event-name.js';
