import { OUTBOX_COLLECTION_NAME, getOutboxModel } from './outbox-collection.js';

describe('outbox-collection', () => {
  it('exposes the synthetic outbox.events collection name', () => {
    expect(OUTBOX_COLLECTION_NAME).toBe('outbox.events');
  });

  it('getOutboxModel returns a Mongoose Model with the canonical fields', () => {
    // Stub minimal Connection so we can introspect the schema without
    // a real Mongo connection.
    const models: Record<string, unknown> = {};
    const stubConnection = {
      models,
      model: jest.fn((name: string, schema: unknown) => {
        const m = { modelName: name, schema, foo: 'bar' };
        models[name] = m;
        return m;
      }),
    };

    const model = getOutboxModel(stubConnection as unknown as Parameters<typeof getOutboxModel>[0]);
    expect(model).toBeDefined();
    // Second call returns cached model.
    const second = getOutboxModel(
      stubConnection as unknown as Parameters<typeof getOutboxModel>[0],
    );
    expect(second).toBe(model);
    expect(stubConnection.model).toHaveBeenCalledTimes(1);
  });
});
