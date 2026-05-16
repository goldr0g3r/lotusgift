import { RESERVATION_PORT, StubReservationPort } from './reservation-port.js';

describe('StubReservationPort', () => {
  const port = new StubReservationPort();

  it('reserve returns ok with reservationId', async () => {
    const result = await port.reserve({
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 2,
      idempotencyKey: 'cart-1',
      ttlSec: 900,
      actorId: 'user-1',
    });
    expect(result.ok).toBe(true);
    expect(result.reservationId).toContain('stub-cart-1');
    expect(result.created).toBe(true);
  });

  it('peek returns empty array', async () => {
    expect(await port.peek('v1', 'w1')).toEqual([]);
  });

  it('exports RESERVATION_PORT symbol', () => {
    expect(typeof RESERVATION_PORT).toBe('symbol');
  });
});
