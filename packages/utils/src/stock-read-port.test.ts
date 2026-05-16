import { STOCK_READ_PORT, StubStockReadPort, type StockReadPort } from './stock-read-port.js';

describe('StubStockReadPort', () => {
  let port: StockReadPort;

  beforeEach(() => {
    port = new StubStockReadPort();
  });

  it('returns a Map keyed by every requested variantId', async () => {
    const result = await port.batchGet(['v1', 'v2', 'v3']);
    expect(result.size).toBe(3);
    expect(result.has('v1')).toBe(true);
    expect(result.has('v2')).toBe(true);
    expect(result.has('v3')).toBe(true);
  });

  it('returns { available: 0, reserved: 0 } for every entry (stub semantics)', async () => {
    const result = await port.batchGet(['v1', 'v2']);
    for (const snapshot of result.values()) {
      expect(snapshot.available).toBe(0);
      expect(snapshot.reserved).toBe(0);
    }
  });

  it('returns an ISO-8601 updatedAt timestamp on every entry', async () => {
    const before = Date.now();
    const result = await port.batchGet(['v1']);
    const after = Date.now();
    const snap = result.get('v1');
    expect(snap).toBeDefined();
    const ts = Date.parse(snap!.updatedAt);
    expect(Number.isNaN(ts)).toBe(false);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('returns an empty Map when given an empty array (no errors)', async () => {
    const result = await port.batchGet([]);
    expect(result.size).toBe(0);
  });

  it('exports STOCK_READ_PORT as a Symbol for use as a NestJS DI token', () => {
    expect(typeof STOCK_READ_PORT).toBe('symbol');
    expect(STOCK_READ_PORT.description).toBe('@repo/utils#StockReadPort');
  });
});
