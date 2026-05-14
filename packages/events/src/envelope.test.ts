import { BaseEventEnvelopeSchema } from './envelope.js';

const VALID_ULID = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const VALID_DATETIME = '2026-05-14T10:30:00Z';

function validEnvelope(overrides: Record<string, unknown> = {}) {
  return {
    __schemaVersion: '1.0',
    idempotencyKey: 'order:01ARZ:placed:1',
    eventId: VALID_ULID,
    occurredAt: VALID_DATETIME,
    ...overrides,
  };
}

describe('BaseEventEnvelopeSchema', () => {
  it('accepts a minimal envelope', () => {
    const parsed = BaseEventEnvelopeSchema.parse(validEnvelope());
    expect(parsed.__schemaVersion).toBe('1.0');
    expect(parsed.eventId).toBe(VALID_ULID);
  });

  it('accepts the full envelope with actor + correlation', () => {
    const parsed = BaseEventEnvelopeSchema.parse(
      validEnvelope({
        correlationId: '01ARZ-corr',
        causationId: '01ARZ-cause',
        actor: { kind: 'user', id: 'usr_123', orgId: 'org_456' },
      }),
    );
    expect(parsed.actor?.kind).toBe('user');
    expect(parsed.correlationId).toBe('01ARZ-corr');
  });

  it('rejects malformed __schemaVersion (full semver)', () => {
    expect(() =>
      BaseEventEnvelopeSchema.parse(validEnvelope({ __schemaVersion: '1.0.0' })),
    ).toThrow();
  });

  it('rejects empty idempotencyKey', () => {
    expect(() =>
      BaseEventEnvelopeSchema.parse(validEnvelope({ idempotencyKey: '' })),
    ).toThrow();
  });

  it('rejects malformed ULID', () => {
    expect(() => BaseEventEnvelopeSchema.parse(validEnvelope({ eventId: 'short' }))).toThrow();
  });

  it('rejects malformed occurredAt', () => {
    expect(() =>
      BaseEventEnvelopeSchema.parse(validEnvelope({ occurredAt: '2026-05-14 10:30' })),
    ).toThrow();
  });

  it('rejects invalid actor kinds', () => {
    expect(() =>
      BaseEventEnvelopeSchema.parse(
        validEnvelope({ actor: { kind: 'robot', id: 'r1' } }),
      ),
    ).toThrow();
  });
});
