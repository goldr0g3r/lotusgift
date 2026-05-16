import { InMemoryReservationService } from './in-memory-reservation.service.js';

describe('InMemoryReservationService', () => {
  let port: InMemoryReservationService;

  beforeEach(() => {
    port = new InMemoryReservationService();
  });

  it('reserve is idempotent for same key', async () => {
    const input = {
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 3,
      idempotencyKey: 'idem-1',
      ttlSec: 900,
      actorId: 'u1',
    };
    const first = await port.reserve(input);
    const second = await port.reserve(input);
    expect(first.reservationId).toBe(second.reservationId);
    expect(second.created).toBe(false);
  });

  it('extend enforces one-time cap', async () => {
    await port.reserve({
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 1,
      idempotencyKey: 'idem-2',
      ttlSec: 900,
      actorId: 'u1',
    });
    const ext1 = await port.extend({
      variantId: 'v1',
      warehouseId: 'w1',
      idempotencyKey: 'idem-2',
      ttlSec: 900,
    });
    expect(ext1.ok).toBe(true);
    const ext2 = await port.extend({
      variantId: 'v1',
      warehouseId: 'w1',
      idempotencyKey: 'idem-2',
      ttlSec: 900,
    });
    expect(ext2.ok).toBe(false);
  });

  it('release removes reservation', async () => {
    await port.reserve({
      variantId: 'v1',
      warehouseId: 'w1',
      qty: 1,
      idempotencyKey: 'idem-3',
      ttlSec: 900,
      actorId: 'u1',
    });
    await port.release({ variantId: 'v1', warehouseId: 'w1', idempotencyKey: 'idem-3' });
    expect(await port.peek('v1', 'w1')).toHaveLength(0);
  });
});
