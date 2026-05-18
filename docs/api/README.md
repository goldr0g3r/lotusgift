# API documentation

**Audience**: frontend developers + API consumers
**Phase**: P5 onward (first endpoints land)
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Pipeline

```
Zod schemas (packages/validators)
  → NestJS controllers (services/*)
    → nestjs-zod extracts OpenAPI metadata
      → OpenAPI 3.1 snapshot (packages/openapi-spec)
        → Kubb v3 code generation (@kubb/plugin-react-query)
          → @repo/api (packages/api) — TanStack Query hooks
            → apps/web-* consume typed hooks
```

## Commands

| Action | Command |
| ------ | ------- |
| Check for OpenAPI drift | `pnpm openapi:check` |
| Regenerate OpenAPI snapshot | `pnpm openapi:generate` |
| Regenerate Kubb hooks | `pnpm api:generate` |

## OpenAPI snapshot location

```
packages/openapi-spec/openapi.json
```

This file is committed to git. CI fails if the running api-gateway produces a different spec than the committed snapshot (`pnpm openapi:check`).

## Using generated hooks (frontend)

```typescript
// In apps/web-customer
import { useGetProducts, useCreateOrder } from '@repo/api';

function ProductList() {
  const { data, isLoading } = useGetProducts({ category: 'corporate-gifts' });
  // ...
}
```

## API conventions

- **Base URL**: `http://localhost:3001/api` (dev) / `https://api.lotusgift.in/api` (prod)
- **Auth**: Cookie-based sessions (Better-Auth). Include credentials in fetch.
- **Errors**: RFC 9457 Problem Details format (`{ type, title, status, detail, instance }`)
- **Pagination**: cursor-based (`?cursor=<id>&limit=20`)
- **Versioning**: URL path prefix when breaking changes (`/api/v2/...`) — avoid as long as possible

## CHANGELOG

API breaking changes will be tracked in a future `docs/api/CHANGELOG.md` once the API stabilizes (P12+).

## See also

- [`../how-to/add-a-rest-endpoint.md`](../how-to/add-a-rest-endpoint.md)
- [`.github/instructions/api-type-safety.instructions.md`](../../.github/instructions/api-type-safety.instructions.md)
- [`../../kubb.config.ts`](../../kubb.config.ts)
