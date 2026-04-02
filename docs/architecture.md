# Architecture

## Overview

Lotus Gift is a **Turborepo monorepo** with two applications and three shared packages, organized using pnpm workspaces.

```
┌─────────────────────────────────────────────────────┐
│                   Client Browser                     │
│  ┌──────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │ Public Pages │  │   Portal   │  │ Admin Panel  │ │
│  └──────┬───────┘  └─────┬──────┘  └──────┬───────┘ │
└─────────┼────────────────┼─────────────────┼─────────┘
          │                │                 │
          ▼                ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              apps/web (Next.js 16)                   │
│  App Router · React 19 · Tailwind CSS · TanStack Q  │
└────────────────────────┬────────────────────────────┘
                         │ HTTP (fetch, credentials)
                         ▼
┌─────────────────────────────────────────────────────┐
│              apps/api (NestJS 11)                    │
│  REST · Swagger · Better Auth · Mongoose · Razorpay  │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
               ┌───────────────────┐
               │ MongoDB Database  │
               └───────────────────┘
```

## Monorepo Layout

### Apps

| App | Path | Framework | Port | Purpose |
|-----|------|-----------|------|---------|
| `web` | `apps/web` | Next.js 16 (App Router) | 3000 | Frontend SPA with SSR |
| `api` | `apps/api` | NestJS 11 | 3001 | REST API backend |

### Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@repo/ui` | `packages/ui` | Shared React components |
| `@repo/eslint-config` | `packages/eslint-config` | Shared ESLint rules |
| `@repo/typescript-config` | `packages/typescript-config` | Shared tsconfig bases |

### Turborepo Tasks

Defined in `turbo.json`:

| Task | Behavior |
|------|----------|
| `build` | Topologically ordered with caching; outputs `.next/**` and `dist/**` |
| `dev` | Persistent, no caching; runs both apps in parallel |
| `lint` | Topologically ordered |
| `check-types` | Topologically ordered |

## Backend Architecture (NestJS)

The API follows NestJS module conventions with controllers, services, DTOs, and a global auth guard.

### Module Map

```
apps/api/src/
├── main.ts                 # Bootstrap, CORS, Swagger, Better Auth mount
├── auth.ts                 # Better Auth server configuration
├── app.module.ts           # Root module
├── app.controller.ts       # Health check endpoint
├── schemas/                # Mongoose schemas
├── auth/                   # BetterAuthGuard, @Public() decorator
├── products/               # CRUD + public slug lookup
├── categories/             # CRUD + public slug lookup
├── clients/                # B2B client management
├── quotes/                 # Quote CRUD + line items
├── orders/                 # Order CRUD + status management
├── contacts/               # Contact inquiry management
├── dashboard/              # Aggregated statistics
├── testimonials/           # Customer testimonials
├── banners/                # Homepage banners
├── settings/               # Key-value site settings
├── payments/               # Razorpay integration
└── email/                  # Nodemailer transactional email
```

### Request Flow

1. Request hits Express server on port 3001
2. Routes matching `/api/auth/*` are handled directly by Better Auth (mounted before NestJS body parsing)
3. All other `/api/*` routes go through NestJS pipeline:
   - Global `ValidationPipe` (whitelist + transform)
   - Global `BetterAuthGuard` (session validation via headers)
   - Routes marked `@Public()` bypass the guard
   - Controller → Service → Mongoose → MongoDB

## Frontend Architecture (Next.js)

### App Router Layout

```
apps/web/app/
├── layout.tsx              # Root layout (fonts, global CSS, tracking)
├── (public)/               # Public storefront
│   ├── layout.tsx          # Header + Footer + WhatsApp button
│   ├── page.tsx            # Homepage
│   ├── about/
│   ├── contact/
│   ├── request-quote/
│   ├── products/
│   ├── categories/[slug]/
│   ├── terms/
│   └── privacy/
├── portal/                 # Client portal (auth required)
│   ├── layout.tsx
│   ├── login/
│   ├── register/
│   ├── quotes/
│   ├── orders/
│   └── profile/
├── admin/                  # Admin dashboard (admin role required)
│   ├── layout.tsx
│   ├── login/
│   ├── products/
│   ├── categories/
│   ├── clients/
│   ├── quotes/
│   ├── orders/
│   ├── inquiries/
│   ├── wholesale/
│   ├── content/
│   └── settings/
└── landing/[slug]/         # Dynamic marketing landing pages
```

### Key Libraries

| Library | Purpose |
|---------|---------|
| `@tanstack/react-query` | Server state management and caching |
| `react-hook-form` + `zod` | Form handling with schema validation |
| `lucide-react` | Icon library |
| `better-auth/react` | Auth client hooks (`useSession`, `signIn`, etc.) |

### API Communication

All API calls use a centralized `lib/api.ts` utility that wraps `fetch` with:
- Automatic `Content-Type: application/json` headers
- `credentials: 'include'` for cookie-based auth
- Error extraction from response body
- Typed `get`, `post`, `patch`, `delete` methods

## Data Flow

### Quote-to-Order Lifecycle

```
Client requests quote → Admin creates Quote (DRAFT)
    → Admin sends to client (SENT)
    → Client accepts (ACCEPTED)
    → Admin converts to Order (PENDING)
    → Razorpay payment (CONFIRMED)
    → Fulfillment (PROCESSING → SHIPPED → DELIVERED)
```

### Payment Flow

1. Admin or system creates a Razorpay order via `POST /api/payments/create-order/:orderId`
2. Frontend opens Razorpay checkout modal
3. On success, `POST /api/payments/verify` validates the signature
4. Order status updates to CONFIRMED with payment details stored
