# Quality Gap Matrix

This matrix tracks feature coverage, integration dependencies, and current verification status across the Lotus Gift monorepo.

## Legend
- `Ready`: implemented and meaningfully covered by tests.
- `Partial`: implemented but only lightly tested or missing negative-path coverage.
- `Gap`: missing tests, mismatched contracts, or incomplete production controls.

## Web To API Feature Matrix

| Feature | Web Surface | API Surface | Integrations | Current Status | Required Action |
|---|---|---|---|---|---|
| Public catalog browsing | `apps/web/app/(public)/products*`, `categories*` | `GET /products`, `GET /categories` | MongoDB | Partial | Add API + UI regression tests for filters, errors, and empty states. |
| Public inquiry submit | `apps/web/app/(public)/contact/page.tsx` | `POST /contacts` | MongoDB, SMTP | Partial | Keep create public, restrict non-create routes, add abuse/validation tests. |
| Quote request | `apps/web/app/(public)/request-quote/page.tsx` | `POST /quotes` | MongoDB | Gap | Add auth/ownership rules and end-to-end flow tests. |
| Admin orders | `apps/web/app/admin/orders/page.tsx` | `GET/PATCH /orders/:id` | MongoDB, Razorpay | Gap | Remove bearer token pattern, align route contracts, add status transition tests. |
| Admin inquiries | `apps/web/app/admin/inquiries/page.tsx` | `GET/PATCH/DELETE /contacts` | MongoDB | Gap | Protect endpoints by role and verify unauthorized access is blocked. |
| Portal profile and orders | `apps/web/app/portal/**/*` | `GET/PATCH /users`, `GET /orders` | Better Auth, MongoDB | Gap | Use cookie-session API client only, add ownership tests and portal smoke checks. |
| Payments flow | Admin/portal payment actions | `POST /payments/create-order/:orderId`, `POST /payments/verify` | Razorpay | Gap | Add signature, idempotency, and demo mode tests. |

## API Module Test Coverage Matrix

| Module | Unit Tests | Integration Tests | AuthZ Coverage | Notes |
|---|---|---|---|---|
| `auth` | Gap | Gap | Partial | Guard exists but lacks role-based constraints and negative tests. |
| `products` | Gap | Gap | Gap | Public + admin surfaces need explicit role checks and response shape tests. |
| `categories` | Gap | Gap | Gap | Public reads are fine; write operations need admin-only policy coverage. |
| `clients` | Gap | Gap | Gap | Needs ownership/role rules and validation tests. |
| `quotes` | Gap | Gap | Gap | Lifecycle logic exists but no regression tests for totals, states, and access control. |
| `orders` | Gap | Gap | Gap | Route contract drift and missing authorization checks. |
| `payments` | Gap | Gap | Gap | Core production path currently unverified by tests. |
| `contacts` | Gap | Gap | Gap | Entire controller currently public; requires policy hardening and tests. |
| `dashboard` | Gap | Gap | Gap | Requires admin-only enforcement and aggregate correctness tests. |
| `testimonials` | Gap | Gap | Gap | Public read/admin write policy not explicitly enforced via tests. |
| `banners` | Gap | Gap | Gap | Public read/admin write policy not explicitly enforced via tests. |
| `settings` | Gap | Gap | Gap | Sensitive config path requires restricted access and audit tests. |

## Integration Verification Matrix

| Integration | Current Verification | Risk | Action |
|---|---|---|---|
| MongoDB (Mongoose) | Manual only | High | Add integration tests with seeded fixtures for quote/order/payment paths. |
| Better Auth (session cookies) | Partial in runtime, not in tests | High | Standardize frontend calls to cookie credentials and test guard/role behavior. |
| Razorpay | Runtime code only | High | Add unit tests for signature verification and order creation fallback/real mode. |
| SMTP/Nodemailer | Runtime fallback exists | Medium | Add tests for JSON fallback, validation, and failure propagation. |
| Analytics (Facebook Pixel) | UI-only usage | Low | Add smoke test to confirm script mounting on intended surfaces. |

## Documentation Drift Register

| Doc | Drift |
|---|---|
| `docs/cloudinary.md` | Describes integration without corresponding `apps/api/src/cloudinary` module implementation. |
| `README.md`, `apps/api/README.md`, `apps/web/README.md` | Generic template language does not match current scripts, architecture, and runbook-level operations. |
| Auth/API docs | Need explicit statement that session-cookie auth is canonical over local-storage bearer usage. |

