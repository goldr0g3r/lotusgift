import { Test, type TestingModule } from '@nestjs/testing';

import { GeocoderService, type FetchLike } from './geocoder.service.js';
import { ENV_TOKEN, GEOCODER_FETCH_TOKEN } from '../vendor-service.tokens.js';
import { WarehouseSchema } from '../schemas/warehouse.schema.js';

interface FakeEnv {
  NOMINATIM_BASE_URL: string;
  NOMINATIM_USER_AGENT: string;
  GEOCODE_CACHE_TTL_SECONDS: number;
}

function buildEnv(): FakeEnv {
  return {
    NOMINATIM_BASE_URL: 'https://nominatim.test/search',
    NOMINATIM_USER_AGENT: 'lotusgift-test',
    GEOCODE_CACHE_TTL_SECONDS: 60,
  };
}

describe('GeocoderService', () => {
  it('returns a GeoJSON Point + caches the result for repeat lookups', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ lat: '12.97', lon: '77.59' }],
    } as unknown as Response);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GeocoderService,
        { provide: ENV_TOKEN, useValue: buildEnv() },
        { provide: GEOCODER_FETCH_TOKEN, useValue: fetchMock as unknown as FetchLike },
      ],
    }).compile();
    const geocoder = moduleRef.get(GeocoderService);

    const first = await geocoder.geocode('MG Road, Bengaluru, IN-KA, 560001');
    expect(first).not.toBeNull();
    expect(first?.type).toBe('Point');
    expect(first?.coordinates).toEqual([77.59, 12.97]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await geocoder.geocode('MG Road, Bengaluru, IN-KA, 560001');
    expect(second).not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null when Nominatim returns 429 (rate-limited)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => [],
    } as unknown as Response);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GeocoderService,
        { provide: ENV_TOKEN, useValue: buildEnv() },
        { provide: GEOCODER_FETCH_TOKEN, useValue: fetchMock as unknown as FetchLike },
      ],
    }).compile();
    const geocoder = moduleRef.get(GeocoderService);
    const result = await geocoder.geocode('test address');
    expect(result).toBeNull();
  });

  it('returns null when Nominatim returns zero results', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        GeocoderService,
        { provide: ENV_TOKEN, useValue: buildEnv() },
        { provide: GEOCODER_FETCH_TOKEN, useValue: fetchMock as unknown as FetchLike },
      ],
    }).compile();
    const geocoder = moduleRef.get(GeocoderService);
    const result = await geocoder.geocode('nothing matches');
    expect(result).toBeNull();
  });
});

describe('Warehouse schema indexes', () => {
  it('declares a 2dsphere index on the location field', () => {
    const indexes = WarehouseSchema.indexes();
    const has2dsphereOnLocation = indexes.some(([fields]) => {
      return (
        fields !== null &&
        typeof fields === 'object' &&
        (fields as Record<string, unknown>).location === '2dsphere'
      );
    });
    expect(has2dsphereOnLocation).toBe(true);
  });

  it('declares a sparse 2dsphere index on serviceZone.polygon', () => {
    const indexes = WarehouseSchema.indexes();
    const has2dsphereOnPolygon = indexes.some(([fields, opts]) => {
      const f = fields as Record<string, unknown>;
      const o = opts as Record<string, unknown> | undefined;
      return f['serviceZone.polygon'] === '2dsphere' && o?.sparse === true;
    });
    expect(has2dsphereOnPolygon).toBe(true);
  });

  it('declares a compound index on [address.state, address.pincode]', () => {
    const indexes = WarehouseSchema.indexes();
    const hasStatePincode = indexes.some(([fields]) => {
      const f = fields as Record<string, unknown>;
      return f['address.state'] === 1 && f['address.pincode'] === 1;
    });
    expect(hasStatePincode).toBe(true);
  });
});
