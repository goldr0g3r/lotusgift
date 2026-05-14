import { MongoOutboxRepository } from './mongo-outbox-repository.js';

/**
 * Light-touch tests for the repository. The full Mongo round-trip lives
 * in the (opt-in) integration test under `OUTBOX_INTEGRATION=1`; here we
 * assert the method calls produce the right Mongo queries via a stub
 * Model.
 */

function buildStubConnection() {
  const created: Array<{ doc: Record<string, unknown>; session: unknown }> = [];
  const updates: Array<{ filter: unknown; update: unknown }> = [];
  const findUpdates: Array<{ filter: unknown; update: unknown }> = [];
  let claimQueue: Array<Record<string, unknown> | null> = [];

  const model = {
    create: jest.fn(async (docs: Array<Record<string, unknown>>, opts: { session: unknown }) => {
      docs.forEach((doc) => created.push({ doc, session: opts.session }));
      return docs;
    }),
    findOneAndUpdate: jest.fn(async (filter: unknown, update: unknown) => {
      findUpdates.push({ filter, update });
      const next = claimQueue.shift();
      if (!next) return null;
      return {
        toObject: () => next,
      };
    }),
    updateOne: jest.fn(async (filter: unknown, update: unknown) => {
      updates.push({ filter, update });
      return { modifiedCount: 1 };
    }),
    updateMany: jest.fn(async (filter: unknown, update: unknown) => {
      updates.push({ filter, update });
      return { modifiedCount: 2 };
    }),
  };

  const connection = {
    models: { __OutboxEvent__: model },
    model: jest.fn(),
  };

  return {
    connection,
    model,
    created,
    updates,
    findUpdates,
    setClaimQueue(queue: Array<Record<string, unknown> | null>) {
      claimQueue = [...queue];
    },
  };
}

describe('MongoOutboxRepository', () => {
  it('insert() writes a row inside the supplied session', async () => {
    const stub = buildStubConnection();
    const repo = new MongoOutboxRepository(
      stub.connection as unknown as Parameters<typeof MongoOutboxRepository>[0],
    );
    const session = { id: 'sess-1' };
    await repo.insert(
      { type: 'order.placed.v1', payload: { n: 1 }, idempotencyKey: 'order:1:placed:1' },
      session as unknown as Parameters<typeof repo.insert>[1],
    );
    expect(stub.created).toHaveLength(1);
    expect(stub.created[0]!.session).toBe(session);
    expect(stub.created[0]!.doc.eventType).toBe('order.placed.v1');
    expect(stub.created[0]!.doc.idempotencyKey).toBe('order:1:placed:1');
    expect(stub.created[0]!.doc.status).toBe('pending');
  });

  it('claim() returns up to batchSize rows', async () => {
    const stub = buildStubConnection();
    stub.setClaimQueue([
      { _id: 'a', eventType: 't', payload: {}, idempotencyKey: 'k1' },
      { _id: 'b', eventType: 't', payload: {}, idempotencyKey: 'k2' },
      null, // signals no more pending rows
    ]);
    const repo = new MongoOutboxRepository(
      stub.connection as unknown as Parameters<typeof MongoOutboxRepository>[0],
    );
    const claimed = await repo.claim(5);
    expect(claimed).toHaveLength(2);
    expect(claimed[0]!._id).toBe('a');
  });

  it('markPublished() and markFailed() issue the expected updates', async () => {
    const stub = buildStubConnection();
    const repo = new MongoOutboxRepository(
      stub.connection as unknown as Parameters<typeof MongoOutboxRepository>[0],
    );
    await repo.markPublished('abc');
    await repo.markFailed('xyz', 'boom');
    expect(stub.updates).toHaveLength(2);
    expect(stub.updates[0]!.filter).toEqual({ _id: 'abc' });
    expect(stub.updates[1]!.filter).toEqual({ _id: 'xyz' });
  });

  it('recoverStaleClaims() returns the modified count', async () => {
    const stub = buildStubConnection();
    const repo = new MongoOutboxRepository(
      stub.connection as unknown as Parameters<typeof MongoOutboxRepository>[0],
    );
    const recovered = await repo.recoverStaleClaims(30_000);
    expect(recovered).toBe(2);
  });
});
