# `@repo/observability`

LotusGift v2's L2 OpenTelemetry bootstrap. Exports `bootstrapOtel`, `shutdownOtel`, and the `recordHealth` gauge helper — wired by the gateway (P4) and consumed by Grafana Cloud dashboards (P21 hardening).

Per [`.cursor/rules/architecture-layers.mdc`](../../.cursor/rules/architecture-layers.mdc), L2 imports L0–L1 + sibling L2. Framework-agnostic — the NestJS bootstrap module wrapper lives in `apps/api-gateway` (P4).

## Module map

| Module | Exports | Use when |
| --- | --- | --- |
| [`otel.ts`](src/otel.ts) | `bootstrapOtel(opts)`, `BootstrapOtelOptions` | Constructing the NodeSDK at the top of `main.ts` BEFORE any instrumented module imports. |
| [`shutdown.ts`](src/shutdown.ts) | `shutdownOtel(sdk, timeoutMs?)` | Wiring into `OnApplicationShutdown` so pending spans + metrics flush before process exit. |
| [`health-metrics.ts`](src/health-metrics.ts) | `recordHealth(input)`, `RecordHealthInput` | Emitting the `service.health` gauge from the `/healthz` + `/readyz` endpoints. |

## Bootstrap recipe

```ts
// apps/api-gateway/src/main.ts (P4)
import { loadEnv } from '@repo/config';
import { bootstrapOtel, shutdownOtel } from '@repo/observability';

const env = loadEnv(process.env);

const otel = bootstrapOtel({
  serviceName: env.OTEL_SERVICE_NAME,
  otlpEndpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  otlpHeaders: env.OTEL_EXPORTER_OTLP_HEADERS,
});
otel.start();

// ...then import the rest of the app + bootstrap Nest

process.on('SIGTERM', async () => {
  await shutdownOtel(otel);
});
```

Order matters: `otel.start()` MUST run before importing any module that should be instrumented (NestJS, Mongoose, etc.). Per the OTEL Node.js SDK contract, instrumentations patch require() at load time.

## Grafana Cloud OTLP target

Send data to `https://otlp-gateway-<zone>.grafana.net/otlp` with `Authorization: Basic <base64(instanceId:apiToken)>`. Configuration via the `EnvSchema` (P3 `@repo/config`):

```sh
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-ap-south-1.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic eW91cl9pbnN0YW5jZV9pZDp5b3VyX2FwaV90b2tlbg==
OTEL_SERVICE_NAME=lotusgift-api
```

(See [Grafana Cloud OTLP setup](https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp) — research note cite #11.)

## Auto-instrumentations matrix

P3 enables a deliberately small set for cold-start speed (research note D5):

- `@opentelemetry/instrumentation-http` — incoming + outgoing HTTP requests.
- `@opentelemetry/instrumentation-mongoose` — Mongoose queries + commands.

Disabled by default:

- `@opentelemetry/instrumentation-pino` — known bug (research note D4 + source #7); logs flow through stdout → systemd → Loki via Grafana Agent in P21.
- `@opentelemetry/instrumentation-express` — opt in via `OTEL_NODE_ENABLED_INSTRUMENTATIONS=express` when the gateway needs route-level spans.
- `@opentelemetry/instrumentation-fs` — too noisy for the gateway; opt in for diagnostic deep-dives only.

Consumers opt in / out via the standard `OTEL_NODE_ENABLED_INSTRUMENTATIONS` allow-list env var per [OTEL ZeroCode docs](https://opentelemetry.io/docs/zero-code/js/configuration).

## Health metrics

```ts
import { recordHealth } from '@repo/observability';

// inside the /healthz controller (P4)
recordHealth({ scope: 'liveness', status: 1 });

// inside /readyz after probing Mongo + Redis (P4)
recordHealth({ scope: 'readiness', status: mongoOk ? 1 : 0, probe: 'mongo' });
recordHealth({ scope: 'readiness', status: redisOk ? 1 : 0, probe: 'redis' });
```

Surfaces in Grafana as `service_health{scope="readiness", probe="mongo"}` — wired into the alerting dashboards landed in P21.

## Sentry deferral

Sentry SDK init is **not** part of P3 — it lands in P21 (observability hardening) where it sits alongside the Grafana dashboards + Loki query library. Rationale in research note D3: avoid overloading this PR; Sentry has its own setup quirks (DSN, beforeSend, source-map upload) that warrant their own design pass.

## PostHog deferral

PostHog browser + server wrappers live in `@repo/analytics-sdk` (P3b — next phase). Per [`.cursor/rules/analytics-instrumentation.mdc`](../../.cursor/rules/analytics-instrumentation.mdc) `@repo/analytics-sdk` is L3 (depends on L2). Observability and analytics intentionally live in separate packages so the gateway's traces+metrics path doesn't drag in the PostHog browser bundle.

## L2 placement

Imports `@opentelemetry/*` (L0 npm) + `@repo/config` (L2 sibling) + `@repo/utils` (L2 sibling). Does NOT import NestJS, Express, or any web framework — the Nest module wrapper lives in `apps/api-gateway` (P4).
