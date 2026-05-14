/**
 * Single Zod re-export point for the whole monorepo. Consumers import `z`
 * from this module (or via the `@repo/validators` barrel) instead of
 * `import { z } from 'zod'` directly so version drift is impossible.
 *
 * Pinned to Zod 4.x per `docs/research/phase-2-l1-packages.md` D1.
 */
export { z } from 'zod';
export type { ZodError, ZodType, ZodTypeAny } from 'zod';
