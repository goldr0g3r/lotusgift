---
name: add-rest-endpoint
description: Walks through adding a Zod-validated NestJS REST endpoint with Better-Auth decorators, outbox event emission, OpenAPI verification, and Kubb regeneration. Use when adding a new endpoint to any services/* library or when the user asks to expose a new route from the api-gateway.
disable-model-invocation: true
---

# Add a REST Endpoint

This skill walks the agent through adding a new REST endpoint to LotusGift v2's modular monolith. Replaces the deprecated `add-trpc-endpoint` workflow (this codebase is NestJS REST, not tRPC, per ADR-002 in the parent plan).

## Workflow

Copy this checklist and track progress as you go:

```
Add-REST-Endpoint Progress:
- [ ] Step 1: Define Zod schemas in @repo/validators
- [ ] Step 2: Create the DTO via createZodDto next to the controller
- [ ] Step 3: Implement the controller method with the right Better-Auth decorator
- [ ] Step 4: Emit outbox event(s) for any state-mutating change
- [ ] Step 5: Add unit tests (Tier-1: ≥85% lines / ≥80% branches)
- [ ] Step 6: Run pnpm openapi:check to verify the OpenAPI snapshot
- [ ] Step 7: Run pnpm api:generate to regenerate Kubb hooks
- [ ] Step 8: Wire the consumer hook into the relevant apps/web-* feature
- [ ] Step 9: Run pnpm test + pnpm lint + pnpm typecheck before opening PR
```

## Step 1 — Define Zod schemas in `@repo/validators`

```ts
// packages/validators/src/<service>/<endpoint>.ts
import { z } from 'zod';

export const RouteDraftRequest = z.object({
  cartId: z.string().ulid(),
  orgId: z.string().ulid().optional(),
});

export const RouteDraftResponse = z.object({
  decision: z.enum(['cart', 'rfq']),
  reason: z.enum(['under_threshold', 'moq_exceeded', 'value_exceeded', 'requires_customization']),
  rfqDraftId: z.string().ulid().optional(),
});

export type RouteDraftRequest = z.infer<typeof RouteDraftRequest>;
export type RouteDraftResponse = z.infer<typeof RouteDraftResponse>;
```

Export from the package barrel `packages/validators/src/index.ts`.

## Step 2 — Create the DTO

```ts
// services/rfq-service/src/dto/route-draft.dto.ts
import { createZodDto } from 'nestjs-zod';
import { RouteDraftRequest } from '@repo/validators';

export class RouteDraftDto extends createZodDto(RouteDraftRequest) {}
```

## Step 3 — Implement the controller

Pick the right Better-Auth decorator:

| Decorator | When to use |
|-----------|-------------|
| `@Session()` | Endpoint requires a logged-in user; injects the session. |
| `@OptionalAuth()` | Endpoint is public BUT may behave differently if logged in. |
| `@AllowAnonymous()` | Truly public endpoint (e.g. `GET /products`). |

```ts
// services/rfq-service/src/rfq.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { RouteDraftResponse } from '@repo/validators';
import { RouteDraftDto } from './dto/route-draft.dto';
import { RfqService } from './rfq.service';

@Controller('rfq')
export class RfqController {
  constructor(private readonly rfq: RfqService) {}

  @Post('route-draft')
  @ZodSerializerDto(RouteDraftResponse)
  async routeDraft(@Body() dto: RouteDraftDto, @Session() session: UserSession) {
    return this.rfq.routeDraft(dto, session.user);
  }
}
```

The global `ZodValidationPipe` (wired once in `apps/api-gateway/src/app.module.ts`) auto-validates the body against `RouteDraftRequest`. The global `ZodSerializerInterceptor` strips fields not in `RouteDraftResponse`.

## Step 4 — Emit outbox events

Any state-mutating endpoint MUST publish via `OutboxPort` inside the same Mongo transaction (see [`event-driven-discipline`](../../rules/event-driven-discipline.mdc)).

```ts
// services/rfq-service/src/rfq.service.ts
import { Inject } from '@nestjs/common';
import { OUTBOX_PORT, type OutboxPort } from '@repo/utils';
import { RfqDraftRoutedV1 } from '@repo/events';

constructor(
  @Inject(OUTBOX_PORT) private readonly outbox: OutboxPort,
  private readonly db: DatabaseSession,
) {}

async routeDraft(dto, user) {
  return this.db.session.withTransaction(async (session) => {
    const decision = await this.policy.decide(dto, { session });
    if (decision.decision === 'rfq') {
      const draft = await this.drafts.create([{ ... }], { session });
      await this.outbox.publish(
        {
          __schemaVersion: '1.0',
          idempotencyKey: `rfq:${draft._id}:routed:1`,
          rfqDraftId: draft._id.toString(),
          userId: user.id,
        } satisfies RfqDraftRoutedV1,
        { session },
      );
      return { ...decision, rfqDraftId: draft._id.toString() };
    }
    return decision;
  });
}
```

If you're adding a new event type, define its schema in `packages/events/src/<service>/<event>.v1.ts` first.

## Step 5 — Unit tests

`rfq` is a Tier-1 service: ≥85% lines / ≥80% branches, plus saga happy + unhappy paths.

```ts
// services/rfq-service/src/rfq.controller.spec.ts
describe('POST /rfq/route-draft', () => {
  it('routes to cart when under all thresholds', async () => { ... });
  it('routes to rfq + emits outbox event when MOQ exceeded', async () => { ... });
  it('routes to rfq when requires_customization is true', async () => { ... });
  it('rejects unauthenticated callers', async () => { ... });
});
```

## Step 6 — OpenAPI snapshot

```bash
pnpm openapi:generate   # regenerates apps/api-gateway/openapi.json
pnpm openapi:check      # CI-equivalent diff vs the committed snapshot
```

If `openapi:check` reports drift, commit the regenerated `openapi.json`.

## Step 7 — Kubb regenerate

```bash
pnpm api:generate
```

This regenerates `packages/api/src/<service>/` with the new TanStack Query v5 hooks (Kubb v3). For our example, you'll get a new `useRouteDraft()` hook export.

## Step 8 — Consumer hook in the app

```tsx
// apps/web-customer/src/features/checkout/route-decision.ts
import { useRouteDraft } from '@repo/api';

export function useDecideRoute() {
  return useRouteDraft();
}

// apps/web-customer/src/features/checkout/checkout-button.tsx
const { mutate, data } = useDecideRoute();
const onClick = () => mutate({ cartId: cart.id, orgId: org?.id });
```

## Step 9 — Pre-PR checks

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm openapi:check
pnpm api:generate
pnpm dep-cruiser
```

When all pass, open the PR. The `api-type-safety-auditor` subagent will review the change against [`api-type-safety.mdc`](../../rules/api-type-safety.mdc).

## Common mistakes to avoid

- **Skipping the Zod schema** in `@repo/validators` and defining it inline in the controller — breaks Kubb regeneration.
- **Using `class-validator` decorators** — every DTO must come from `createZodDto`.
- **Calling `EventEmitter.emit()` directly** — use `OutboxPort.publish` so the publish is transactional.
- **Forgetting the Better-Auth decorator** — every controller method needs exactly one of `@Session()` / `@OptionalAuth()` / `@AllowAnonymous()`.
- **Missing the OpenAPI regeneration** — frontends silently break when the snapshot diverges.

## References

- [`api-type-safety` rule](../../rules/api-type-safety.mdc)
- [`event-driven-discipline` rule](../../rules/event-driven-discipline.mdc)
- [`microservice-boundaries` rule](../../rules/microservice-boundaries.mdc)
- [`test-coverage` rule](../../rules/test-coverage.mdc)
- [`docs/research/phase-0-rules.md`](../../../docs/research/phase-0-rules.md) — citations for nestjs-zod, Kubb, Better-Auth.
