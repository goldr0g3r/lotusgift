import { PostHog } from 'posthog-node';

import { redact } from '@repo/utils';

import { assertValidEventName } from './event-name.js';

export interface CreateServerAnalyticsOptions {
  /** PostHog project API key (`POSTHOG_KEY`). */
  apiKey: string;
  /** PostHog Cloud host (`POSTHOG_HOST`). Defaults to EU. */
  host?: string;
  /** Capture-buffer size before flush. Default 20 (PostHog default). */
  flushAt?: number;
  /** Flush interval in ms. Default 10_000 (PostHog default). */
  flushInterval?: number;
  /**
   * Inject a pre-built `PostHog` instance (for tests). When provided,
   * `apiKey`/`host`/etc. are ignored.
   */
  client?: PostHog;
}

export interface CaptureInput {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
  /**
   * Skip the default PII redactor (whitelisted analytics-team events
   * only — most callers should leave this `false`).
   */
  skipRedaction?: boolean;
}

export interface IdentifyInput {
  distinctId: string;
  properties?: Record<string, unknown>;
}

export interface ServerAnalytics {
  capture(input: CaptureInput): void;
  identify(input: IdentifyInput): void;
  flush(): Promise<void>;
  shutdown(): Promise<void>;
}

function assertValidDistinctId(distinctId: string): void {
  if (!distinctId || distinctId === 'undefined' || distinctId === 'null') {
    throw new Error(
      `Invalid distinctId "${distinctId}". Must be a non-empty string (typically a ULID, or "anonymous-<sessionId>" for unauthenticated traffic).`,
    );
  }
}

export function createServerAnalytics(opts: CreateServerAnalyticsOptions): ServerAnalytics {
  const client =
    opts.client ??
    new PostHog(opts.apiKey, {
      host: opts.host ?? 'https://eu.i.posthog.com',
      flushAt: opts.flushAt ?? 20,
      flushInterval: opts.flushInterval ?? 10_000,
    });

  return {
    capture(input) {
      assertValidDistinctId(input.distinctId);
      assertValidEventName(input.event);
      const properties = input.skipRedaction
        ? input.properties
        : input.properties
          ? redact(input.properties)
          : undefined;
      client.capture({
        distinctId: input.distinctId,
        event: input.event,
        properties,
      });
    },
    identify(input) {
      assertValidDistinctId(input.distinctId);
      const properties = input.properties ? redact(input.properties) : undefined;
      client.identify({
        distinctId: input.distinctId,
        properties,
      });
    },
    async flush() {
      await client.flush();
    },
    async shutdown() {
      await client.shutdown();
    },
  };
}

export { assertValidEventName, isValidEventName, InvalidEventNameError } from './event-name.js';
