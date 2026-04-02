# Authentication

Lotus Gift uses [Better Auth](https://www.better-auth.com/) for authentication, providing email/password login with session-based security and role-based access control.

## Architecture

```
┌──────────────┐     POST /api/auth/sign-in/email     ┌──────────────────┐
│  Browser     │ ──────────────────────────────────── │  Better Auth     │
│  (Next.js)   │                                      │  (Express mount) │
│              │ ◄──── Set-Cookie: better-auth.token  │                  │
└──────┬───────┘                                      └────────┬─────────┘
       │                                                       │
       │ Cookie included in all /api/* requests                │ Validates session
       │                                                       │ via MongoDB
       ▼                                                       ▼
┌──────────────┐     BetterAuthGuard checks session    ┌──────────────────┐
│  NestJS      │ ◄──────────────────────────────────── │  MongoDB         │
│  Controllers │                                       │  (session coll.) │
└──────────────┘                                       └──────────────────┘
```

## Server Configuration

Better Auth is configured in `apps/api/src/auth.ts`:

- **Adapter:** MongoDB via `mongodbAdapter`
- **Email/Password:** Enabled with minimum 6-character passwords
- **Custom User Fields:** `phone` and `company`
- **Session:** 7-day expiry, daily renewal, 5-minute cookie cache
- **Trusted Origins:** Configured via `FRONTEND_URL` env var
- **Admin Plugin:** Default role is `"client"`, admin role is `"admin"`

### Route Mounting

Better Auth is mounted directly on the Express instance in `main.ts`, **before** NestJS body parsing middleware:

```
expressApp.all('/api/auth/{*any}', toNodeHandler(auth));
```

This means all `/api/auth/*` routes bypass the NestJS pipeline entirely and are handled by Better Auth's own router.

## Client Configuration

The auth client is configured in `apps/web/lib/auth-client.ts`:

```typescript
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") || "http://localhost:3001",
  plugins: [adminClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
```

## Roles

| Role | Description | Access |
|------|-------------|--------|
| `client` | Default role for new registrations | Portal: quotes, orders, profile |
| `admin` | Administrative access | Full admin dashboard and all API endpoints |

Roles are managed by Better Auth's admin plugin. The default role for new signups is `"client"`.

## Guards and Decorators

### BetterAuthGuard (Global)

Applied globally to all NestJS routes. On every request it:

1. Extracts headers from the incoming request
2. Calls `auth.api.getSession({ headers })` to validate the session
3. Attaches the user and session to the request object
4. Rejects with `401 Unauthorized` if no valid session exists

### @Public() Decorator

Routes that should be accessible without authentication use the `@Public()` decorator:

```typescript
@Public()
@Get()
findAll() {
  return this.productsService.findAll();
}
```

This sets metadata that the `BetterAuthGuard` checks to skip session validation.

### Public Routes Summary

The following routes/controllers are public (no auth required):

- `GET /api` — health check
- `/api/auth/*` — all Better Auth endpoints
- `GET /api/products` — product listing and detail
- `GET /api/categories` — category listing and detail
- `GET /api/testimonials` — testimonials listing
- `GET /api/banners` — banners listing
- `GET /api/settings` — site settings
- `/api/contacts` — entire controller (create, read, update, delete)

## Auth Flows

### Registration

1. User fills out the registration form on `/portal/register`
2. Frontend calls `signUp.email({ email, password, name, phone?, company? })`
3. Better Auth creates `User` and `Account` records
4. User is assigned the `"client"` role by default
5. Session cookie is set automatically

### Login

1. User enters credentials on `/portal/login` or `/admin/login`
2. Frontend calls `signIn.email({ email, password })`
3. Better Auth validates credentials and creates a `Session`
4. Session token is returned as an HTTP-only cookie
5. Frontend redirects to the appropriate dashboard

### Session Management

- Sessions expire after **7 days**
- Sessions are renewed if the user is active (checked every **24 hours**)
- Cookie caching reduces database lookups (cached for **5 minutes**)
- Sign out destroys the session record and clears the cookie

### Admin vs Client Routing

The frontend checks the user's role after login:

- `role === "admin"` → redirected to `/admin`
- `role === "client"` → redirected to `/portal`

Both admin and portal layouts verify the session on mount and redirect to the login page if unauthenticated.

## Security Notes

- Passwords are hashed using **scrypt** (Better Auth's default)
- Session tokens are stored as **HTTP-only cookies** (not accessible via JavaScript)
- CORS is configured to only allow requests from the `FRONTEND_URL` origin
- The `BETTER_AUTH_SECRET` env var must be set to a strong, random string (minimum 32 characters recommended)
- The admin plugin supports user banning with optional expiry dates
