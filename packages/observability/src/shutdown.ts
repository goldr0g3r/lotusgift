import type { NodeSDK } from '@opentelemetry/sdk-node';

/**
 * Gracefully shut down the OTEL SDK: flush pending spans + metrics, then
 * stop the exporters. Caller wraps in `OnApplicationShutdown` hook (P4).
 *
 * Resolves even if `sdk.shutdown()` rejects — log + swallow internally so
 * a single broken exporter doesn't block process exit.
 */
export async function shutdownOtel(sdk: NodeSDK, timeoutMs = 5_000): Promise<void> {
  await Promise.race([
    sdk.shutdown().catch((err: unknown) => {
      // Best-effort; observability shutdown failures should NEVER block
      // process exit. Surface to stderr for ops + move on.
      // eslint-disable-next-line no-console
      console.error('[observability] OTEL shutdown error:', err);
    }),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}
