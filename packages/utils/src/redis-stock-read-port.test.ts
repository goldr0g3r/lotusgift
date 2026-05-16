import { StubReservationPort } from './reservation-port.js';
import { RedisStockReadPort } from './redis-stock-read-port.js';

describe('RedisStockReadPort', () => {
  it('returns zero for unknown variants when db is unavailable', async () => {
    const port = new RedisStockReadPort({ db: undefined } as never, new StubReservationPort());
    const map = await port.batchGet(['variant-a', 'variant-b']);
    expect(map.size).toBe(2);
    expect(map.get('variant-a')?.available).toBe(0);
    expect(map.get('variant-b')?.reserved).toBe(0);
  });

  it('aggregates snapshot rows from mongo', async () => {
    const find = jest.fn().mockReturnValue({
      toArray: () =>
        Promise.resolve([
          {
            variantId: 'v1',
            warehouseId: 'w1',
            onHand: 10,
            reservedCount: 2,
            pendingLedgerCount: 0,
            updatedAt: new Date('2026-05-16T00:00:00.000Z'),
          },
        ]),
    });
    const connection = {
      db: { collection: () => ({ find }) },
    };
    const port = new RedisStockReadPort(connection as never, new StubReservationPort());
    const map = await port.batchGet(['v1']);
    expect(map.get('v1')?.available).toBe(8);
    expect(map.get('v1')?.reserved).toBe(2);
  });
});
