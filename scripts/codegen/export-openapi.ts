/**
 * Boot the api-gateway in-process, snapshot the OpenAPI JSON spec, and
 * write it to ./openapi.json at the repo root for Kubb consumption.
 *
 * Used by `pnpm openapi:export` + CI's openapi-drift job. Avoids the
 * "boot the gateway in a separate container, curl /api/docs-json"
 * dance for local + CI use.
 *
 * Implementation lands in P4 follow-up: the script currently emits a
 * placeholder spec so the codegen pipeline can be wired end-to-end
 * even before the first real controller ships.
 */
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const PLACEHOLDER_SPEC = {
  openapi: '3.1.0',
  info: {
    title: 'LotusGift API',
    version: '0.1.0',
    description:
      'LotusGift v2 modular-monolith API. Placeholder spec emitted by ' +
      'scripts/codegen/export-openapi.ts until the gateway boot path ' +
      'is wired into this script in a P4 follow-up.',
  },
  paths: {
    '/healthz': {
      get: {
        operationId: 'getHealthz',
        summary: 'Liveness probe',
        responses: {
          '200': {
            description: 'Process is alive',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status', 'uptimeSec', 'timestamp'],
                  properties: {
                    status: { type: 'string', enum: ['ok'] },
                    uptimeSec: { type: 'number' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {},
} as const;

async function main(): Promise<void> {
  const outputPath = resolve(process.cwd(), 'openapi.json');
  await writeFile(outputPath, `${JSON.stringify(PLACEHOLDER_SPEC, null, 2)}\n`, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Wrote OpenAPI spec to ${outputPath}`);
}

void main();
