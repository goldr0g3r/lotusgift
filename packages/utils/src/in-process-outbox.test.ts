import { InProcessOutboxPort } from './in-process-outbox.js';
import type { MongoOutboxRepository } from './mongo-outbox-repository.js';

/**
 * Fake repository for deterministic relayer unit tests. Avoids the
 * mongodb-memory-server overhead while exercising every relayer code
 * path (claim ordering, mark-published, mark-failed, recover-stale).
 */
class FakeRepository {
  insertCalls: Array<{ type: string; payload: unknown; idempotencyKey: string }> = [];
  rows: Array<{
    _id: string;
    eventType: string;
    payload: unknown;
    idempotencyKey: string;
    status: 'pending' | 'publishing' | 'published' | 'failed';
    attemptCount: number;
    lastAttemptAt?: Date;
    error?: string;
    createdAt: Date;
  }> = [];
  published: string[] = [];
  failed: Array<{ id: string; error: string }> = [];
  recovered = 0;
  private claimCallCount = 0;

  primeRow(row: {
    _id: string;
    eventType: string;
    payload?: unknown;
    idempotencyKey: string;
  }) {
    this.rows.push({
      payload: {},
      status: 'pending',
      attemptCount: 0,
      createdAt: new Date(),
      ...row,
    });
  }

  async insert(
    event: { type: string; payload: unknown; idempotencyKey: string },
  ): Promise<unknown> {
    this.insertCalls.push(event);
    return { _id: `id-${this.insertCalls.length}` };
  }

  async claim(batchSize: number) {
    this.claimCallCount += 1;
    // Only return rows on the first claim call so the relayer's poll
    // loop has a deterministic single batch to process.
    if (this.claimCallCount > 1) return [];
    const out = this.rows.slice(0, batchSize).map((r) => ({ ...r, status: 'publishing' as const }));
    return out;
  }

  async markPublished(id: string): Promise<void> {
    this.published.push(id);
  }

  async markFailed(id: string, error: string): Promise<void> {
    this.failed.push({ id, error });
  }

  async recoverStaleClaims(_olderThanMs: number): Promise<number> {
    return this.recovered;
  }
}

/**
 * Build a relayer wired to a fake repository. Bypasses the
 * `MongoOutboxRepository` constructor that expects a real Mongo
 * connection.
 */
function buildRelayer(fakeRepo: FakeRepository, opts: { dedupCacheSize?: number } = {}) {
  const relayer = new InProcessOutboxPort({} as unknown as Parameters<typeof InProcessOutboxPort>[0], {
    pollIntervalMs: 10_000_000, // disable auto-poll; we'll drive ticks manually
    ...opts,
  });
  // Surgical replacement of the private repository field. Tests are
  // allowed to reach into private state here — production callers go
  // through the constructor.
  (relayer as unknown as { repository: MongoOutboxRepository }).repository =
    fakeRepo as unknown as MongoOutboxRepository;
  return relayer;
}

function flushTick(relayer: InProcessOutboxPort): Promise<void> {
  return (relayer as unknown as { tick(): Promise<void> }).tick();
}

describe('InProcessOutboxPort', () => {
  it('delivers an event to every subscribed handler exactly once', async () => {
    const repo = new FakeRepository();
    repo.primeRow({
      _id: 'evt-1',
      eventType: 'order.placed.v1',
      idempotencyKey: 'order:o1:placed:1',
    });
    const relayer = buildRelayer(repo);

    const handlerA = jest.fn().mockResolvedValue(undefined);
    const handlerB = jest.fn().mockResolvedValue(undefined);
    relayer.subscribe('order.placed.v1', handlerA);
    relayer.subscribe('order.placed.v1', handlerB);

    await flushTick(relayer);

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);
    expect(repo.published).toEqual(['evt-1']);
  });

  it('dedups same idempotencyKey across consecutive ticks (LRU cache)', async () => {
    const repo = new FakeRepository();
    repo.primeRow({
      _id: 'evt-1',
      eventType: 'order.placed.v1',
      idempotencyKey: 'order:o1:placed:1',
    });
    const relayer = buildRelayer(repo);

    const handler = jest.fn().mockResolvedValue(undefined);
    relayer.subscribe('order.placed.v1', handler);

    // First tick emits + caches the key.
    await flushTick(relayer);
    expect(handler).toHaveBeenCalledTimes(1);

    // Re-prime an identical row (simulating relayer-crash re-delivery).
    repo.published = [];
    repo.rows = []; // clear the previously-claimed evt-1 from the fake queue
    repo['claimCallCount'] = 0; // allow another claim
    repo.primeRow({
      _id: 'evt-2',
      eventType: 'order.placed.v1',
      idempotencyKey: 'order:o1:placed:1', // SAME key
    });
    await flushTick(relayer);

    // Handler NOT called again (dedup); row still marked published.
    expect(handler).toHaveBeenCalledTimes(1);
    expect(repo.published).toEqual(['evt-2']);
  });

  it('marks the row failed when every handler attempt throws', async () => {
    const repo = new FakeRepository();
    repo.primeRow({
      _id: 'evt-fail',
      eventType: 'order.placed.v1',
      idempotencyKey: 'order:fail:1',
    });
    const relayer = buildRelayer(repo);

    relayer.subscribe('order.placed.v1', async () => {
      throw new Error('handler broke');
    });

    await flushTick(relayer);

    expect(repo.failed).toHaveLength(1);
    expect(repo.failed[0]!.id).toBe('evt-fail');
    expect(repo.failed[0]!.error).toMatch(/handler broke/);
    expect(repo.published).toEqual([]);
  });

  it('publish() delegates to repository.insert', async () => {
    const repo = new FakeRepository();
    const relayer = buildRelayer(repo);
    await relayer.publish(
      { type: 'x.y.v1', payload: { n: 1 }, idempotencyKey: 'x:y:1' },
      { session: {} as unknown as Parameters<typeof relayer.publish>[1]['session'] },
    );
    expect(repo.insertCalls).toEqual([
      { type: 'x.y.v1', payload: { n: 1 }, idempotencyKey: 'x:y:1' },
    ]);
  });

  it('unsubscribe stops the handler from receiving future events', async () => {
    const repo = new FakeRepository();
    repo.primeRow({
      _id: 'evt-a',
      eventType: 'order.placed.v1',
      idempotencyKey: 'order:a:1',
    });
    const relayer = buildRelayer(repo);
    const handler = jest.fn().mockResolvedValue(undefined);
    const sub = relayer.subscribe('order.placed.v1', handler);
    sub.unsubscribe();

    await flushTick(relayer);
    expect(handler).not.toHaveBeenCalled();
  });

  it('start() recovers stale claims at bootstrap', async () => {
    const repo = new FakeRepository();
    repo.recovered = 3;
    const messages: Array<{ message: string; meta?: Record<string, unknown> }> = [];
    const relayer = new InProcessOutboxPort(
      {} as unknown as Parameters<typeof InProcessOutboxPort>[0],
      {
        pollIntervalMs: 10_000_000,
        log: (message, meta) => messages.push({ message, meta }),
      },
    );
    (relayer as unknown as { repository: MongoOutboxRepository }).repository =
      repo as unknown as MongoOutboxRepository;
    relayer.start();
    // Allow the recovery promise to flush.
    await new Promise((r) => setTimeout(r, 10));
    await relayer.stop();
    expect(messages.find((m) => m.message.includes('recovered'))).toBeDefined();
  });
});
