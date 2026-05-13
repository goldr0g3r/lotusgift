---
applyTo: "apps/api-gateway/**/*.ts,services/**/*.ts,packages/api/**/*.ts,packages/validators/**/*.ts"
---

# API Type Safety

Every endpoint is a Zod schema in `@repo/validators`, exposed via `nestjs-zod`'s `createZodDto`, validated by the global `ZodValidationPipe`, serialized by the global `ZodSerializerInterceptor`, documented via `cleanupOpenApiDoc(doc)` before `SwaggerModule.setup()`, and consumed in apps via Kubb-generated `@repo/api` TanStack Query v5 hooks.

## Do

- Define request/response schemas in `packages/validators/src/<service>/*.ts`.
- Generate DTOs with `createZodDto(MySchema)` next to the controller.
- Wire `APP_PIPE: ZodValidationPipe` and `APP_INTERCEPTOR: ZodSerializerInterceptor` once in `apps/api-gateway/src/app.module.ts`.
- Run `pnpm openapi:generate` then `pnpm api:generate` (Kubb) on every PR that touches a controller.
- Import hooks from `@repo/api` only — never hand-write `fetch` in app code.

## Don't

- Use `class-validator` / `class-transformer`.
- Hand-write `openapi-types` interfaces or fetch wrappers in apps.
- Use `patchNestJsSwagger` (deprecated — use `cleanupOpenApiDoc`).

## Concrete example — round-trip

```ts
// packages/validators/src/order/place-order.ts
export const PlaceOrderRequest = z.object({ cartId: z.string().ulid(), recipientListId: z.string().ulid().optional() });
export const PlaceOrderResponse = z.object({ orderId: z.string().ulid(), status: z.enum(['routed_to_cart','routed_to_rfq']) });

// services/order-service/src/order.controller.ts
class PlaceOrderDto extends createZodDto(PlaceOrderRequest) {}
@Post() @ZodSerializerDto(PlaceOrderResponse) place(@Body() dto: PlaceOrderDto) { ... }

// apps/web-customer/src/features/checkout/use-place-order.ts
const { mutate } = usePlaceOrder(); // Kubb-emitted from @repo/api
```

## References

[docs/research/phase-0-rules.md](../../docs/research/phase-0-rules.md) — citations #2 (nestjs-zod 5.3.0, retrieved 2026-05-12) and #3 (Kubb v3, retrieved 2026-05-12).
