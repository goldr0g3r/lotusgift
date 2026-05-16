export { BaseEventEnvelopeSchema } from './envelope.js';
export type { BaseEventEnvelope } from './envelope.js';

export {
  bumpMajor,
  bumpMinor,
  formatSchemaVersion,
  isCompatibleVersion,
  parseSchemaVersion,
} from './version.js';
export type { SchemaVersion } from './version.js';

export { OutboxRowSchema } from './outbox.js';
export type { OutboxRow } from './outbox.js';

export { defineEvent } from './builders.js';
export type { DefinedEvent } from './builders.js';

// Per-service event re-exports (P6 onwards each service phase populates
// the matching subpath shell + adds it to the top-level barrel).
export * from './vendor/index.js';
export * from './product/index.js';
export * from './product/index.js';
