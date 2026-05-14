export { createMongoConnection, closeAllConnections } from './connection.js';
export type { CreateConnectionOptions } from './connection.js';

export { namespace, SERVICE_NAMES } from './namespace.js';
export type { ServiceName } from './namespace.js';

export { baseSchemaPlugin } from './base-schema.js';

export { getOutboxModel, OUTBOX_COLLECTION_NAME } from './outbox-collection.js';
export type { OutboxDoc } from './outbox-collection.js';

export { withTransaction } from './transactions.js';
