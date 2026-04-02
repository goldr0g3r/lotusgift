# Contributing

## Development Setup

See [Getting Started](./getting-started.md) for initial setup instructions.

## Project Conventions

### Code Style

- **TypeScript** throughout the entire codebase
- **ESLint** for linting (shared config in `packages/eslint-config`)
- **Prettier** for formatting (configured at the repo root)
- Run `pnpm lint` and `pnpm format` before committing

### Backend (NestJS)

- Follow NestJS module conventions: Controller → Service → Mongoose Model
- Use DTOs with `class-validator` decorators for request validation
- Use `@Public()` decorator to mark unauthenticated routes
- Add Swagger decorators (`@ApiTags`, `@ApiOperation`) to controllers
- Place business logic in services, not controllers
- Use Mongoose models for all database operations

### Frontend (Next.js)

- Use the App Router (no Pages Router)
- Prefer Server Components by default; use `"use client"` only when needed
- Forms use `react-hook-form` with Zod resolvers
- API calls go through `lib/api.ts` — do not call `fetch` directly
- Auth operations use exports from `lib/auth-client.ts`
- Styles use Tailwind CSS utility classes
- Icons from `lucide-react`

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (components) | PascalCase | `Header.tsx` |
| Files (utils/lib) | kebab-case | `auth-client.ts` |
| Files (NestJS) | kebab-case with suffix | `products.controller.ts` |
| React components | PascalCase | `ProductCard` |
| Functions/methods | camelCase | `findBySlug` |
| API routes | kebab-case | `/api/dashboard/stats` |
| Database collections | snake_case | `site_settings` |
| Environment variables | UPPER_SNAKE_CASE | `MONGODB_URI` |

## Branching Strategy

- `main` — production-ready code
- `feature/<name>` — new features
- `fix/<name>` — bug fixes
- `chore/<name>` — maintenance tasks

## Making Changes

### Adding a New API Module

1. Generate the module scaffold:
   ```bash
   cd apps/api
   npx nest generate resource <name>
   ```

2. This creates:
   - `src/<name>/<name>.module.ts`
   - `src/<name>/<name>.controller.ts`
   - `src/<name>/<name>.service.ts`
   - `src/<name>/dto/` directory

3. Add a Mongoose schema to `src/schemas/` if needed and export it from `src/schemas/index.ts`
4. Register the schema in the module with `MongooseModule.forFeature()`
5. Import the module in `app.module.ts`
6. Add `@Public()` to routes that should be unauthenticated
7. Add Swagger decorators for API documentation

### Adding a New Frontend Page

1. Create a new directory under the appropriate route group:
   - `app/(public)/<route>/page.tsx` for public pages
   - `app/admin/<route>/page.tsx` for admin pages
   - `app/portal/<route>/page.tsx` for portal pages

2. Add TypeScript interfaces to `lib/api.ts` if new data types are needed

3. Use the API client for data fetching:
   ```typescript
   const data = await api.get<MyType[]>('/my-endpoint');
   ```

### Modifying the Database Schema

1. Edit or create Mongoose schemas in `apps/api/src/schemas/`
2. Export new schemas from `apps/api/src/schemas/index.ts`
3. Register new schemas in the relevant module via `MongooseModule.forFeature()`
4. Update seed data in `apps/api/src/seed.ts` if applicable
5. Update TypeScript interfaces in `apps/web/lib/api.ts`
6. Update or create corresponding DTOs in the API

## Scripts Reference

### Root

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | Lint all packages |
| `pnpm check-types` | Type check all packages |
| `pnpm format` | Format all files with Prettier |

### API (`apps/api`)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start API in watch mode |
| `pnpm build` | Build for production |
| `pnpm start` | Start with NestJS CLI |
| `pnpm start:prod` | Start production build |
| `pnpm seed` | Seed the database |
| `pnpm lint` | Lint API source files |

### Web (`apps/web`)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Next.js dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Lint with zero warnings threshold |
| `pnpm check-types` | Generate types and check |

## Troubleshooting

### Common Issues

**MongoDB connection refused:**
Ensure MongoDB is running locally (`mongod`) or your `MONGODB_URI` in `.env` is correct.

**Database needs re-seeding:**
```bash
cd apps/api && pnpm seed
```

**Port already in use:**
Kill the existing process or change the port via environment variable.

**CORS errors:**
Ensure `FRONTEND_URL` in the API `.env` matches the frontend's actual origin (including port).

**Auth cookies not working:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check that the API and frontend are on the same domain or CORS is properly configured
- In development, both must use `localhost` (not `127.0.0.1` vs `localhost`)
