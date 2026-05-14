import posthog from 'posthog-js';

/**
 * Snapshot of currently-active feature flags as returned by
 * `posthog.featureFlags.getFlagVariants()`. `true` for boolean-on,
 * a string for multivariate variants, `false`/`undefined` for off.
 */
export type FlagSnapshot = Record<string, boolean | string>;

export type FlagSubscriber = (snapshot: FlagSnapshot) => void;

/**
 * Subscribe to flag updates. Wraps PostHog's `onFeatureFlags` callback
 * into a multi-subscriber broadcast so a React app can drive several
 * UI surfaces from a single underlying PostHog evaluation.
 *
 * Returns an unsubscribe function.
 */
export function subscribeFlags(subscriber: FlagSubscriber): () => void {
  const handler = (_flagsKeys: string[], variants: Record<string, boolean | string>) => {
    subscriber(variants as FlagSnapshot);
  };
  posthog.onFeatureFlags(handler);
  // posthog-js doesn't expose an "off" handler; subscribers stay alive
  // for the lifetime of the page. The returned cleanup function flips a
  // local flag so the caller can no-op delivery client-side.
  let active = true;
  const guardedSubscriber: FlagSubscriber = (s) => {
    if (active) subscriber(s);
  };
  posthog.onFeatureFlags((_keys, variants) => guardedSubscriber(variants as FlagSnapshot));
  return () => {
    active = false;
  };
}

/**
 * Synchronously read the current flag value from the cached PostHog
 * evaluation. `undefined` when PostHog hasn't loaded flags yet — wrap
 * in `useFeatureFlag` (per-app) to subscribe + re-render.
 */
export function getFlag(flag: string): boolean | string | undefined {
  return posthog.getFeatureFlag(flag);
}

export function isFlagEnabled(flag: string): boolean {
  return Boolean(posthog.isFeatureEnabled(flag));
}
