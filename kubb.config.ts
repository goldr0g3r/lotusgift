import { defineConfig } from '@kubb/core';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginReactQuery } from '@kubb/plugin-react-query';
import { pluginTs } from '@kubb/plugin-ts';

/**
 * Kubb codegen for the LotusGift v2 OpenAPI spec.
 *
 * Input: the JSON spec served by the gateway at /api/docs-json. To
 * regenerate locally:
 *
 *   pnpm --filter @lotusgift/api-gateway start &
 *   curl http://localhost:3001/api/docs-json > openapi.json
 *   pnpm api:generate
 *
 * In CI, the workflow boots the gateway in a smoke container, dumps the
 * spec, runs codegen, and diffs the output against the committed
 * `packages/api/src/` — any drift fails the PR.
 *
 * Plugins:
 *   - pluginOas: parses the OpenAPI 3.1 spec
 *   - pluginTs: emits TypeScript types from the schemas
 *   - pluginReactQuery: emits TanStack Query v5 hooks
 *     (`use<Operation>Query` for GETs, `use<Operation>Mutation` for
 *     POST/PUT/DELETE/PATCH).
 *
 * Output lands in `packages/api/src/` and is committed.
 */
export default defineConfig({
  root: '.',
  input: { path: './openapi.json' },
  output: { path: './packages/api/src/.generated', clean: true },
  plugins: [
    pluginOas({ output: false, validate: true }),
    pluginTs({ output: { path: 'types' } }),
    pluginReactQuery({
      output: { path: 'hooks' },
      client: { dataReturnType: 'data' },
      suspense: false,
    }),
  ],
});
