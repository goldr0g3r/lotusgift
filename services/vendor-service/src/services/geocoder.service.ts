import { Inject, Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { LRUCache } from 'lru-cache';

import type { Env } from '@repo/config';

import { ENV_TOKEN } from '../vendor-service.tokens.js';

/**
 * Minimal Nominatim search-response shape we care about (per
 * <https://nominatim.org/release-docs/latest/api/Search/> — retrieved
 * 2026-05-15). The full response carries 20+ fields; we project to
 * `lat`/`lon` only.
 */
export interface NominatimResult {
  lat: string;
  lon: string;
}

/**
 * Fetch-shape injected for tests. Matches the global `fetch` signature.
 */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Result returned by `GeocoderService.geocode` — GeoJSON Point ready to
 * persist on the warehouse row.
 */
export interface GeocodeResult {
  type: 'Point';
  /** GeoJSON convention: `[longitude, latitude]`. */
  coordinates: [number, number];
  /** When the geocode call landed (or was served from cache). */
  fetchedAt: string;
}

const GEOCODE_CACHE_DEFAULT_TTL_SECONDS = 86_400;
const GEOCODE_CACHE_MAX_ENTRIES = 10_000;

/**
 * OSM Nominatim geocoder wrapper. Enforces the OSM Foundation 1 req/sec
 * absolute limit + a 24h LRU cache keyed on the normalized address hash.
 *
 * Per `docs/research/phase-6-vendor-service.md` D2 + cite #6 (Nominatim
 * usage policy, retrieved 2026-05-15) — the policy is "1 absolute req/sec
 * combined across all callers", which we enforce in-process via a
 * promise-chain semaphore. Multi-process scaling would push the rate
 * limit to a Redis token bucket; parked to `scaling-up.md`.
 *
 * The cache short-circuits repeated lookups for the same warehouse
 * address (vendors often re-submit with a typo fix), keeping our
 * Nominatim quota burn-rate within free-tier comfort.
 */
@Injectable()
export class GeocoderService implements OnModuleInit {
  private readonly logger = new Logger(GeocoderService.name);
  private readonly cache: LRUCache<string, GeocodeResult>;
  private rateLimitChain: Promise<void> = Promise.resolve();

  constructor(
    @Inject(ENV_TOKEN) private readonly env: Env,
    @Inject('GEOCODER_FETCH') private readonly fetchImpl: FetchLike = fetch,
  ) {
    const ttlSeconds = env.GEOCODE_CACHE_TTL_SECONDS ?? GEOCODE_CACHE_DEFAULT_TTL_SECONDS;
    this.cache = new LRUCache<string, GeocodeResult>({
      max: GEOCODE_CACHE_MAX_ENTRIES,
      ttl: ttlSeconds * 1_000,
    });
  }

  onModuleInit(): void {
    if (!this.env.NOMINATIM_USER_AGENT) {
      this.logger.warn(
        'NOMINATIM_USER_AGENT not set — falling back to default UA. Set it per OSM policy in production.',
      );
    }
  }

  /**
   * Geocode a free-form address string, returning the resolved
   * `[lng, lat]` GeoJSON Point. Cache hits return immediately; cache
   * misses pass through the 1 req/sec semaphore.
   *
   * Returns `null` if the address can't be resolved (no Nominatim
   * results). The caller decides whether to fail the warehouse-create
   * request or persist with `location: null` + retry later.
   */
  async geocode(addressLine: string): Promise<GeocodeResult | null> {
    const key = this.normalizeAddress(addressLine);
    const cached = this.cache.get(key);
    if (cached) {
      this.logger.debug(`Geocode cache hit for "${key}"`);
      return cached;
    }
    const result = await this.fetchWithRateLimit(addressLine);
    if (result) this.cache.set(key, result);
    return result;
  }

  /**
   * Reset both the cache and the in-flight rate-limit chain. Test-only.
   */
  resetForTests(): void {
    this.cache.clear();
    this.rateLimitChain = Promise.resolve();
  }

  private normalizeAddress(addressLine: string): string {
    return addressLine.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private async fetchWithRateLimit(addressLine: string): Promise<GeocodeResult | null> {
    // Chain successive calls so each waits at least 1s after the
    // previous one resolved — implements the OSM 1 req/sec absolute
    // limit without spawning a setInterval poll.
    const wait = this.rateLimitChain;
    let resolveSlot!: () => void;
    this.rateLimitChain = new Promise<void>((resolve) => {
      resolveSlot = resolve;
    });
    await wait;
    try {
      return await this.callNominatim(addressLine);
    } finally {
      setTimeout(resolveSlot, 1_000);
    }
  }

  private async callNominatim(addressLine: string): Promise<GeocodeResult | null> {
    const baseUrl = this.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org/search';
    const url = new URL(baseUrl);
    url.searchParams.set('q', addressLine);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', 'in');
    url.searchParams.set('addressdetails', '0');

    const userAgent = this.env.NOMINATIM_USER_AGENT ?? 'LotusGift-v2-Dev/0.1';

    const response = await this.fetchImpl(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });

    if (response.status === 429) {
      this.logger.warn('Nominatim returned 429 — rate-limited; skipping this address');
      return null;
    }

    if (!response.ok) {
      this.logger.warn(`Nominatim returned ${response.status} for "${addressLine}"`);
      return null;
    }

    const json = (await response.json()) as NominatimResult[];
    if (!Array.isArray(json) || json.length === 0) {
      this.logger.debug(`Nominatim returned no results for "${addressLine}"`);
      return null;
    }
    const first = json[0];
    if (!first) return null;
    const lat = Number(first.lat);
    const lon = Number(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      this.logger.warn(`Nominatim returned non-numeric coordinates for "${addressLine}"`);
      return null;
    }
    return {
      type: 'Point',
      coordinates: [lon, lat],
      fetchedAt: new Date().toISOString(),
    };
  }
}
