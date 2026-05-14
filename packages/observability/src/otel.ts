import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions/incubating';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

export interface BootstrapOtelOptions {
  /** `service.name` resource attribute. Required. */
  serviceName: string;
  /** `service.version` resource attribute. Defaults to `'0.0.0'`. */
  serviceVersion?: string;
  /** `deployment.environment` resource attribute. Defaults to `process.env.NODE_ENV ?? 'development'`. */
  deploymentEnvironment?: string;
  /**
   * OTLP HTTP endpoint, e.g. Grafana Cloud `https://otlp-gateway-<zone>.grafana.net/otlp`.
   * If unset, the OTEL SDK falls back to its default (no remote export).
   */
  otlpEndpoint?: string;
  /**
   * OTLP exporter headers (e.g. `Authorization: Basic <base64>` for
   * Grafana Cloud). Accepts the standard
   * `OTEL_EXPORTER_OTLP_HEADERS=key1=val1,key2=val2` format.
   */
  otlpHeaders?: string;
}

/**
 * Construct a configured OpenTelemetry NodeSDK. Auto-instruments HTTP +
 * Mongoose only (per `docs/research/phase-3-l2-packages.md` D5 — keeps
 * cold-start fast; the full instrumentation matrix is opt-in via
 * `OTEL_NODE_ENABLED_INSTRUMENTATIONS` env var).
 *
 * Caller MUST `await sdk.start()` (or sync `sdk.start()` per current API)
 * BEFORE any module that should be instrumented gets imported. Typically:
 *
 *   const sdk = bootstrapOtel({ serviceName, otlpEndpoint });
 *   sdk.start();
 *   // ...then import the rest of the app
 *
 * Pino instrumentation is NOT enabled — see D4 in the research note
 * (known bug, source #7).
 */
export function bootstrapOtel(opts: BootstrapOtelOptions): NodeSDK {
  const headers = parseOtlpHeaders(opts.otlpHeaders);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: opts.serviceName,
    [ATTR_SERVICE_VERSION]: opts.serviceVersion ?? '0.0.0',
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]:
      opts.deploymentEnvironment ?? process.env.NODE_ENV ?? 'development',
  });

  const traceExporter = new OTLPTraceExporter({
    url: opts.otlpEndpoint ? `${opts.otlpEndpoint}/v1/traces` : undefined,
    headers,
  });

  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: opts.otlpEndpoint ? `${opts.otlpEndpoint}/v1/metrics` : undefined,
      headers,
    }),
    exportIntervalMillis: 60_000,
  });

  return new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-mongoose': { enabled: true },
        // Pino instrumentation skipped — see research note D4.
        '@opentelemetry/instrumentation-pino': { enabled: false },
        // Default off; consumers opt in via env var.
        '@opentelemetry/instrumentation-express': { enabled: false },
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });
}

function parseOtlpHeaders(raw: string | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const [key, ...rest] = pair.split('=');
    if (!key || rest.length === 0) continue;
    out[key.trim()] = rest.join('=').trim();
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
