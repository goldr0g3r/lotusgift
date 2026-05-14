import {
  InvalidEventNameError,
  assertValidEventName,
  isValidEventName,
} from './event-name.js';

describe('event-name', () => {
  const valid = [
    'order placed',
    'quote accepted',
    'mockup approved',
    'recipient-list uploaded',
    'order routed-to-rfq',
    'po credit-extended',
    'e-invoice generated',
    'wizard step-completed',
    'pdp viewed',
  ];

  it.each(valid)('accepts canonical name "%s"', (name) => {
    expect(isValidEventName(name)).toBe(true);
    expect(() => assertValidEventName(name)).not.toThrow();
  });

  const invalid = [
    'orderPlaced',           // camelCase
    'ORDER_PLACED',          // snake-upper
    'order_placed',          // snake-lower (space required)
    '  order placed',        // leading whitespace
    'order placed  ',        // trailing whitespace
    'order  placed',         // double space
    'order',                 // missing verb
    '',                      // empty
    '-order placed',         // leading dash
    '123 placed',            // ok actually (digit prefix allowed per regex)
  ];

  // The last entry is actually valid by our regex (numeric prefix
  // permitted); test it separately.
  for (const name of invalid.slice(0, -1)) {
    it(`rejects invalid name "${name}"`, () => {
      expect(isValidEventName(name)).toBe(false);
      expect(() => assertValidEventName(name)).toThrow(InvalidEventNameError);
    });
  }

  it('allows digit-prefixed names (regex permits)', () => {
    expect(isValidEventName('123 placed')).toBe(true);
  });

  it('InvalidEventNameError carries the rule reference', () => {
    try {
      assertValidEventName('orderPlaced');
      fail('expected to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidEventNameError);
      expect((err as Error).message).toMatch(/analytics-instrumentation/);
    }
  });
});
