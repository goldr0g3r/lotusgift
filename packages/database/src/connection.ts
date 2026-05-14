import mongoose, { type Connection, type ConnectOptions } from 'mongoose';

/**
 * Options for `createMongoConnection`. Accepts every Mongoose
 * `ConnectOptions` field. We override two defaults at the top:
 * - `autoIndex` defaults `false` in production, `true` in dev/test.
 * - `serverSelectionTimeoutMS` defaults to 5_000 (Mongoose default is 30s,
 *   which hangs misconfigured deploys far too long).
 */
export type CreateConnectionOptions = ConnectOptions;

const connectionCache = new Map<string, Connection>();

/**
 * Open (or reuse) a Mongoose connection. Singleton-per-URI within a
 * process so consumers can call this freely without leaking pools.
 *
 * Graceful shutdown: register `await connection.close()` in the bootstrap
 * shutdown hook (api-gateway's `OnApplicationShutdown` in P4).
 */
export function createMongoConnection(
  uri: string,
  opts: CreateConnectionOptions = {},
): Connection {
  const existing = connectionCache.get(uri);
  if (existing && existing.readyState !== 0 /* disconnected */) {
    return existing;
  }

  const autoIndex = opts.autoIndex ?? process.env.NODE_ENV !== 'production';
  const serverSelectionTimeoutMS = opts.serverSelectionTimeoutMS ?? 5_000;

  const connection = mongoose.createConnection(uri, {
    ...opts,
    autoIndex,
    serverSelectionTimeoutMS,
  });

  connectionCache.set(uri, connection);
  return connection;
}

/**
 * Close every cached connection. Test cleanup helper; production should
 * call `connection.close()` on the specific connection it owns.
 */
export async function closeAllConnections(): Promise<void> {
  const closures = Array.from(connectionCache.values()).map((conn) => conn.close());
  await Promise.all(closures);
  connectionCache.clear();
}
