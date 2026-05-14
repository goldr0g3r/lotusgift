import { namespace, SERVICE_NAMES } from './namespace.js';

describe('namespace', () => {
  it('composes <service>.<entity> for every P2 service', () => {
    for (const service of SERVICE_NAMES) {
      expect(namespace(service, 'foo')).toBe(`${service}.foo`);
    }
  });

  it('rejects unknown service prefixes at runtime', () => {
    expect(() =>
      namespace('not-a-service' as unknown as (typeof SERVICE_NAMES)[number], 'foo'),
    ).toThrow(/Unknown service/);
  });

  it('rejects empty entity names', () => {
    expect(() => namespace('order', '')).toThrow(/cannot be empty/);
  });

  it('rejects whitespace-only entity names', () => {
    expect(() => namespace('order', '   ')).toThrow(/cannot be empty/);
  });

  it('rejects entity names containing the namespace separator', () => {
    expect(() => namespace('order', 'orders.archive')).toThrow(/must not contain/);
  });

  it('trims surrounding whitespace from entity names', () => {
    expect(namespace('order', '  orders  ')).toBe('order.orders');
  });
});
