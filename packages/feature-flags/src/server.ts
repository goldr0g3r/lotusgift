import { LRUCache } from 'lru-cache';
import { PostHog } from 'posthog-node';

export interface CreateServerFlagClientOptions {
  /** PostHog project API key. */
  apiKey: string;
  /** PostHog Cloud host. Defaults to EU. */
  host?: string;
  /** Cache TTL in ms. Default 60_000 (60 seconds). */
  cacheTtlMs?: number;
  /** Max cache entries. Default 10_000. */
  cacheMax?: number;
  /**
   * Inject a pre-built `PostHog` instance (for tests). When provided,
   * `apiKey`/`host` are ignored.
   */
  client?: PostHog;
}

export interface FlagEvaluationContext {
  distinctId: string;
  /** Group context (e.g. `{ organization: orgId }`). Optional. */
  groups?: Record<string, string>;
  /**
   * User properties for flag-targeting rules. PostHog expects string
   * values (numbers/bools encoded by the caller via `String(...)`).
   * Optional.
   */
  personProperties?: Record<string, string>;
}

export interface ServerFlagClient {
  /**
   * Resolve a boolean feature flag. Cached for `cacheTtlMs` per
   * (flag, distinctId, propertiesHash) tuple.
   */
  isEnabled(flag: string, ctx: FlagEvaluationContext): Promise<boolean>;
  /**
   * Resolve a multivariate flag — returns the variant string or
   * `false`/`undefined` when disabled.
   */
  variant(
    flag: string,
    ctx: FlagEvaluationContext,
  ): Promise<string | boolean | undefined>;
  /** Force-refresh by clearing the cache. */
  clearCache(): void;
  /** Flush + close the underlying PostHog client. */
  shutdown(): Promise<void>;
}

function hashContext(flag: string, ctx: FlagEvaluationContext): string {
  // Cheap stable hash — JSON.stringify works for our payload shape (flat,
  // primitive values). For exotic property types use a stronger hash.
  return `${flag}::${ctx.distinctId}::${JSON.stringify({
    groups: ctx.groups ?? null,
    props: ctx.personProperties ?? null,
  })}`;
}

export function createServerFlagClient(
  opts: CreateServerFlagClientOptions,
): ServerFlagClient {
  const client =
    opts.client ??
    new PostHog(opts.apiKey, {
      host: opts.host ?? 'https://eu.i.posthog.com',
    });

  // LRUCache requires the value type to extend `{}` (non-nullish), so we
  // wrap the resolved flag value in a single-property object and unwrap
  // on read. Sentinel-object lets us cache `false`/`undefined` distinct
  // from cache-miss.
  type CacheValue = { v: boolean | string | undefined };
  const cache = new LRUCache<string, CacheValue>({
    max: opts.cacheMax ?? 10_000,
    ttl: opts.cacheTtlMs ?? 60_000,
  });

  return {
    async isEnabled(flag, ctx) {
      const key = hashContext(flag, ctx);
      const cached = cache.get(key);
      if (cached !== undefined) {
        return Boolean(cached.v);
      }
      const value = await client.isFeatureEnabled(flag, ctx.distinctId, {
        groups: ctx.groups,
        personProperties: ctx.personProperties,
      });
      const resolved = value ?? false;
      cache.set(key, { v: resolved });
      return Boolean(resolved);
    },
    async variant(flag, ctx) {
      const key = `variant::${hashContext(flag, ctx)}`;
      const cached = cache.get(key);
      if (cached !== undefined) {
        return cached.v;
      }
      const value = await client.getFeatureFlag(flag, ctx.distinctId, {
        groups: ctx.groups,
        personProperties: ctx.personProperties,
      });
      const wrapped: CacheValue = { v: value };
      cache.set(key, wrapped);
      return value;
    },
    clearCache() {
      cache.clear();
    },
    async shutdown() {
      await client.shutdown();
    },
  };
}
