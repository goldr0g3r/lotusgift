import { z } from '@repo/validators';

import { defineEvent } from './builders.js';
import { bumpMajor, bumpMinor, isCompatibleVersion, parseSchemaVersion } from './version.js';

const VALID_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const VALID_DATETIME = '2026-05-14T10:30:00Z';

const SampleEvent = defineEvent(
  'sample.placed.v1',
  z.object({ amount: z.number().int() }),
);

function validPublish(overrides: Record<string, unknown> = {}) {
  return {
    __schemaVersion: '1.0',
    idempotencyKey: 'sample:01ARZ:placed:1',
    eventId: VALID_ULID,
    occurredAt: VALID_DATETIME,
    type: SampleEvent.name,
    payload: { amount: 100 },
    ...overrides,
  };
}

describe('defineEvent', () => {
  it('exposes the event name as a constant', () => {
    expect(SampleEvent.name).toBe('sample.placed.v1');
  });

  it('parses a wrapped payload through the envelope schema', () => {
    const parsed = SampleEvent.schema.parse(validPublish());
    expect(parsed.type).toBe('sample.placed.v1');
    expect(parsed.payload.amount).toBe(100);
  });

  it('rejects events with the wrong type discriminator', () => {
    expect(() => SampleEvent.schema.parse(validPublish({ type: 'sample.placed.v2' }))).toThrow();
  });

  it('rejects events with an invalid payload', () => {
    expect(() =>
      SampleEvent.schema.parse(validPublish({ payload: { amount: 'not-a-number' } })),
    ).toThrow();
  });

  it('rejects events missing the envelope `__schemaVersion`', () => {
    const { __schemaVersion: _omitted, ...withoutVersion } = validPublish();
    expect(() => SampleEvent.schema.parse(withoutVersion)).toThrow();
  });
});

describe('version helpers', () => {
  it('parses MAJOR.MINOR strings', () => {
    expect(parseSchemaVersion('1.0')).toEqual({ major: 1, minor: 0 });
    expect(parseSchemaVersion('12.345')).toEqual({ major: 12, minor: 345 });
  });

  it('throws on full semver', () => {
    expect(() => parseSchemaVersion('1.0.0')).toThrow();
  });

  it('throws on non-numeric components', () => {
    expect(() => parseSchemaVersion('1.x')).toThrow();
  });

  it('treats same-MAJOR as compatible', () => {
    expect(isCompatibleVersion('1.0', '1.5')).toBe(true);
    expect(isCompatibleVersion('1.5', '1.0')).toBe(true);
  });

  it('treats different-MAJOR as incompatible', () => {
    expect(isCompatibleVersion('1.0', '2.0')).toBe(false);
  });

  it('bumps minor + major correctly', () => {
    expect(bumpMinor('1.0')).toBe('1.1');
    expect(bumpMinor('1.5')).toBe('1.6');
    expect(bumpMajor('1.5')).toBe('2.0');
  });
});
