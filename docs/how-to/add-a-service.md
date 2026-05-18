# Add a service

**Audience**: developers creating new bounded-context services
**Phase**: P5 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## When to add a service

Each bounded context in the modular monolith gets its own Nest library under `services/`. The 16 planned services are already scaffolded. This guide is for if you need a 17th.

## Steps

### 1. Open a research note first

Per [`research-note-per-module`](../../.cursor/rules/research-note-per-module.mdc), create `docs/research/phase-<N>-<service-name>.md` BEFORE writing code.

### 2. Scaffold the package

```powershell
npx tsx scripts/scaffold-package.ts <service-name>-service services
```

This creates:
```
services/<service-name>-service/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── <service-name>.module.ts
│   ├── <service-name>.service.ts
│   └── <service-name>.controller.ts
└── test/
```

### 3. Add to workspace

The scaffold script updates `pnpm-workspace.yaml` automatically. Verify:

```powershell
pnpm install
pnpm build --filter @repo/<service-name>-service
```

### 4. Mount in api-gateway

```typescript
// apps/api-gateway/src/app.module.ts
import { NewServiceModule } from '@repo/<service-name>-service';

@Module({
  imports: [
    // ... existing modules
    NewServiceModule,
  ],
})
export class AppModule {}
```

### 5. Namespace collections

Per deployment-mode rule, prefix all MongoDB collections:

```typescript
@Schema({ collection: '<service-name>.entities' })
export class Entity extends Document { ... }
```

### 6. Cross-service communication

- **Reads**: via `@repo/api/internal` (gateway client)
- **Writes**: via `OutboxPort.publish(event)` — NEVER import another service directly

## See also

- [`.github/instructions/deployment-mode.instructions.md`](../../.github/instructions/deployment-mode.instructions.md)
- [`.github/instructions/microservice-boundaries.instructions.md`](../../.github/instructions/microservice-boundaries.instructions.md)
- [`.github/instructions/architecture-layers.instructions.md`](../../.github/instructions/architecture-layers.instructions.md)
