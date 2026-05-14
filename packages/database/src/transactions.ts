import type { Connection, ClientSession } from 'mongoose';

/**
 * Run `work` inside a Mongo transaction. Wraps Mongoose's
 * `session.withTransaction(...)` which auto-handles commit, abort, and
 * retry on `TransientTransactionError` + `UnknownTransactionCommitResult`
 * (see Mongoose 8 docs — `docs/research/phase-3-l2-packages.md` cite #1).
 *
 * The callback MUST pass `{ session }` to every Mongoose operation
 * inside or the operation runs OUTSIDE the transaction. There is no
 * compile-time guard against this — code review + tests catch it.
 *
 * @example
 * ```ts
 * await withTransaction(connection, async (session) => {
 *   await Orders.create([{ ... }], { session });
 *   await OutboxEvents.create([{ ... }], { session });
 * });
 * ```
 */
export async function withTransaction<TResult>(
  connection: Connection,
  work: (session: ClientSession) => Promise<TResult>,
): Promise<TResult> {
  const session = await connection.startSession();
  try {
    let result!: TResult;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
