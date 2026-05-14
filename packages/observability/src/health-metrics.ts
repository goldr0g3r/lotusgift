import { metrics } from '@opentelemetry/api';

/**
 * Health metric helper. Emits the `service.health` gauge consumed by
 * Grafana dashboards (P21) for the `/healthz` + `/readyz` endpoints
 * (P4). Lazy-resolves the meter on first call so observability bootstrap
 * doesn't have to happen before this module loads.
 */
const METER_NAME = '@repo/observability';

let healthGauge: ReturnType<ReturnType<typeof metrics.getMeter>['createGauge']> | undefined;

export interface RecordHealthInput {
  /** Scope tag — typically `liveness` or `readiness`. */
  scope: 'liveness' | 'readiness';
  /** 1 when healthy, 0 when not. */
  status: 0 | 1;
  /** Optional probe sub-scope (e.g. `mongo`, `redis`, `outbox`). */
  probe?: string;
}

export function recordHealth(input: RecordHealthInput): void {
  if (!healthGauge) {
    healthGauge = metrics.getMeter(METER_NAME).createGauge('service.health', {
      description: 'Service health probe result (1 = healthy, 0 = unhealthy)',
    });
  }
  healthGauge.record(input.status, {
    scope: input.scope,
    probe: input.probe ?? 'overall',
  });
}
