# Frontend Guide

The frontend is a **Next.js 16** application using the App Router, located at `apps/web`.

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 | Framework (App Router, React Server Components) |
| React 19 | UI library |
| Tailwind CSS 3 | Utility-first styling |
| TanStack React Query | Server state management and caching |
| react-hook-form | Form state management |
| Zod | Schema validation (form resolvers) |
| Lucide React | Icon library |
| Better Auth React | Authentication hooks and utilities |

## Directory Structure

```
apps/web/
├── app/
│   ├── layout.tsx          # Root layout (fonts, CSS, tracking pixel)
│   ├── globals.css         # Tailwind directives and global styles
│   ├── (public)/           # Public storefront routes
│   │   ├── layout.tsx      # Header, Footer, WhatsApp button
│   │   ├── page.tsx        # Homepage
│   │   ├── about/
│   │   ├── contact/
│   │   ├── request-quote/
│   │   ├── products/
│   │   │   ├── page.tsx    # Product catalog
│   │   │   └── [slug]/     # Product detail
│   │   ├── categories/
│   │   │   └── [slug]/     # Category product listing
│   │   ├── terms/
│   │   └── privacy/
│   ├── portal/             # Client portal (authenticated)
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Portal dashboard
│   │   ├── login/
│   │   ├── register/
│   │   ├── quotes/
│   │   ├── orders/
│   │   └── profile/
│   ├── admin/              # Admin panel (admin role)
│   │   ├── layout.tsx
│   │   ├── page.tsx        # Admin dashboard with stats
│   │   ├── login/
│   │   ├── products/
│   │   │   ├── page.tsx    # Product list
│   │   │   └── new/        # Create product
│   │   ├── categories/
│   │   ├── clients/
│   │   │   ├── page.tsx
│   │   │   └── new/
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [id]/
│   │   ├── orders/
│   │   ├── inquiries/
│   │   ├── wholesale/
│   │   ├── content/        # Banners and testimonials
│   │   └── settings/       # Site settings
│   └── landing/
│       └── [slug]/         # Dynamic marketing landing pages
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── WhatsAppButton.tsx
│   └── tracking/
│       └── FacebookPixel.tsx
├── lib/
│   ├── api.ts              # API client (fetch wrapper + TypeScript interfaces)
│   └── auth-client.ts      # Better Auth client instance
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
└── tsconfig.json
```

## Route Groups

### Public Routes `(public)/`

The public storefront is wrapped in a route group with its own layout that includes the site header, footer, and a WhatsApp floating button. These pages are accessible without authentication.

| Route | Page |
|-------|------|
| `/` | Homepage (banners, featured products, testimonials) |
| `/about` | About page |
| `/contact` | Contact form |
| `/request-quote` | Quote request form |
| `/products` | Product catalog with filtering |
| `/products/[slug]` | Product detail page |
| `/categories/[slug]` | Category products listing |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |

### Portal Routes `portal/`

The client portal requires authentication with the `"client"` role. It provides self-service access to quotes and orders.

| Route | Page |
|-------|------|
| `/portal` | Portal dashboard |
| `/portal/login` | Client login |
| `/portal/register` | Client registration |
| `/portal/quotes` | View submitted quotes |
| `/portal/orders` | View orders and track status |
| `/portal/profile` | Edit profile information |

### Admin Routes `admin/`

The admin panel requires authentication with the `"admin"` role. It provides full business management capabilities.

| Route | Page |
|-------|------|
| `/admin` | Dashboard with business metrics |
| `/admin/login` | Admin login |
| `/admin/products` | Manage products (list, create, edit) |
| `/admin/categories` | Manage categories |
| `/admin/clients` | Manage B2B clients |
| `/admin/quotes` | Manage quotes and line items |
| `/admin/orders` | Manage orders and fulfillment |
| `/admin/inquiries` | View and respond to contact inquiries |
| `/admin/wholesale` | Wholesale order management |
| `/admin/content` | Manage banners and testimonials |
| `/admin/settings` | Site-wide settings |

### Landing Pages `landing/[slug]/`

Dynamic marketing landing pages with UTM parameter support. Used for campaign-specific entry points.

## API Client

All API calls go through `lib/api.ts`, which provides a typed wrapper:

```typescript
import { api } from '@/lib/api';

// GET request
const products = await api.get<Product[]>('/products');

// POST request
const newProduct = await api.post<Product>('/products', { name: 'Gift Set', ... });

// PATCH request
await api.patch('/products/abc123', { name: 'Updated Name' });

// DELETE request
await api.delete('/products/abc123');
```

Key behaviors:
- Automatically sets `Content-Type: application/json`
- Includes credentials (cookies) with every request
- Throws errors with the server's error message
- Base URL configured via `NEXT_PUBLIC_API_URL`

## Authentication Client

Auth operations use exports from `lib/auth-client.ts`:

```typescript
import { signIn, signUp, signOut, useSession } from '@/lib/auth-client';

// In a component
const { data: session } = useSession();

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ email, password, name });

// Sign out
await signOut();
```

## Shared UI Package

The `@repo/ui` package (`packages/ui`) provides shared React components used across the frontend. Import them as:

```typescript
import { Button } from '@repo/ui/button';
```

The package is transpiled by Next.js via the `transpilePackages` configuration in `next.config.js`.

## Styling

- **Tailwind CSS 3** for utility-first styling
- **Geist** font family (Sans + Mono) loaded via `next/font`
- Global styles in `app/globals.css`
- Responsive design throughout

## Tracking

- **Facebook Pixel** integration via `components/tracking/FacebookPixel.tsx`
- Configured through the `NEXT_PUBLIC_FB_PIXEL_ID` environment variable
- Loaded as a client component in the root layout
