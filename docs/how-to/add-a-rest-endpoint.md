# Add a REST endpoint

**Audience**: developers adding new API endpoints
**Phase**: P5 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Binding skill

[`.cursor/skills/add-rest-endpoint/SKILL.md`](../../.cursor/skills/add-rest-endpoint/SKILL.md) — the full 9-step automated workflow. Use Cursor's skill runner for guided execution.

## Manual steps (if not using the skill)

### 1. Define Zod schema in `packages/validators`

```typescript
// packages/validators/src/order/create-order.schema.ts
import { z } from 'zod';

export const CreateOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    variantId: z.string().optional(),
  })).min(1),
  shippingAddressId: z.string().min(1),
  paymentMethod: z.enum(['razorpay', 'po', 'credit']),
});

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
```

### 2. Create `createZodDto` in the service

```typescript
// services/order-service/src/dto/create-order.dto.ts
import { createZodDto } from 'nestjs-zod';
import { CreateOrderSchema } from '@repo/validators';

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
```

### 3. Add controller method with decorators

```typescript
// services/order-service/src/order.controller.ts
@Post()
@UseGuards(BetterAuthGuard)
@ApiOperation({ summary: 'Place a new order' })
async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: AuthUser) {
  return this.orderService.placeOrder(dto, user);
}
```

### 4. Emit outbox event

```typescript
// services/order-service/src/order.service.ts
await this.outbox.publish({
  type: 'order.placed.v1',
  payload: { orderId, userId, items, total },
}, { transactionId: session.id });
```

### 5. Verify OpenAPI snapshot

```powershell
pnpm openapi:check
```

If drift detected, regenerate:
```powershell
pnpm openapi:generate
pnpm api:generate  # Kubb → @repo/api hooks
```

### 6. Write tests

Co-locate: `order.controller.spec.ts` next to `order.controller.ts`.

## See also

- [`.github/instructions/api-type-safety.instructions.md`](../../.github/instructions/api-type-safety.instructions.md)
- [`.github/instructions/event-driven-discipline.instructions.md`](../../.github/instructions/event-driven-discipline.instructions.md)
- [`.cursor/skills/add-rest-endpoint/SKILL.md`](../../.cursor/skills/add-rest-endpoint/SKILL.md)
