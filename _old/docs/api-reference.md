# API Reference

Base URL: `http://localhost:3001/api`

Interactive Swagger documentation is available at `/api/docs` when the API server is running.

All protected endpoints require a valid session cookie (set by Better Auth on login). Routes marked **Public** can be accessed without authentication.

---

## Health Check

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api` | Public | Returns API health status |

---

## Authentication

Authentication is handled by Better Auth at `/api/auth/*`. These routes are mounted outside the NestJS pipeline.

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/sign-up/email` | Register with email and password |
| `POST` | `/api/auth/sign-in/email` | Sign in with email and password |
| `POST` | `/api/auth/sign-out` | Sign out (clears session cookie) |
| `GET` | `/api/auth/get-session` | Get current session and user |

See the [Authentication](./authentication.md) doc for full details on the auth flow.

---

## Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/products` | Public | List all active products (with filters) |
| `GET` | `/api/products/slug/:slug` | Public | Get product by slug |
| `GET` | `/api/products/:id` | Public | Get product by ID |
| `GET` | `/api/products/admin` | Protected | List all products (including inactive) |
| `POST` | `/api/products` | Protected | Create a new product |
| `PATCH` | `/api/products/:id` | Protected | Update a product |
| `DELETE` | `/api/products/:id` | Protected | Delete a product |

### Query Parameters (GET list)

| Parameter | Type | Description |
|-----------|------|-------------|
| `categoryId` | string | Filter by category |
| `isFeatured` | boolean | Featured products only |
| `isWholesale` | boolean | Wholesale products only |
| `search` | string | Search by name |

---

## Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/categories` | Public | List all active categories |
| `GET` | `/api/categories/slug/:slug` | Public | Get category by slug (includes products) |
| `GET` | `/api/categories/:id` | Public | Get category by ID |
| `POST` | `/api/categories` | Protected | Create a category |
| `PATCH` | `/api/categories/:id` | Protected | Update a category |
| `DELETE` | `/api/categories/:id` | Protected | Delete a category |

---

## Clients

All client endpoints require authentication.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/clients` | Protected | List all B2B clients |
| `GET` | `/api/clients/:id` | Protected | Get client by ID |
| `POST` | `/api/clients` | Protected | Create a client |
| `PATCH` | `/api/clients/:id` | Protected | Update a client |
| `DELETE` | `/api/clients/:id` | Protected | Delete a client |

---

## Quotes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/quotes` | Protected | List all quotes |
| `GET` | `/api/quotes/:id` | Protected | Get quote with items |
| `POST` | `/api/quotes` | Protected | Create a quote |
| `PATCH` | `/api/quotes/:id` | Protected | Update quote details/status |
| `DELETE` | `/api/quotes/:id` | Protected | Delete a quote |
| `POST` | `/api/quotes/:id/items` | Protected | Add item to quote |
| `DELETE` | `/api/quotes/:id/items/:itemId` | Protected | Remove item from quote |

### Quote Statuses

| Status | Description |
|--------|-------------|
| `DRAFT` | Initial state, being prepared |
| `SENT` | Sent to client for review |
| `ACCEPTED` | Client accepted the quote |
| `REJECTED` | Client rejected the quote |
| `EXPIRED` | Quote validity period ended |

---

## Orders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/orders` | Protected | List orders (filterable by `status`, `userId`) |
| `GET` | `/api/orders/:id` | Protected | Get order with items |
| `POST` | `/api/orders` | Protected | Create an order |
| `PATCH` | `/api/orders/:id` | Protected | Update order status/details |
| `DELETE` | `/api/orders/:id` | Protected | Delete an order |

### Order Statuses

| Status | Description |
|--------|-------------|
| `PENDING` | Awaiting payment or confirmation |
| `CONFIRMED` | Payment received |
| `PROCESSING` | Being prepared for shipment |
| `SHIPPED` | In transit |
| `DELIVERED` | Successfully delivered |
| `CANCELLED` | Order cancelled |

---

## Contact Inquiries

All contact inquiry endpoints are **public** (no authentication required).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/contacts` | Public | List all inquiries |
| `GET` | `/api/contacts/:id` | Public | Get inquiry by ID |
| `POST` | `/api/contacts` | Public | Submit a contact inquiry |
| `PATCH` | `/api/contacts/:id` | Public | Update inquiry status/notes |
| `DELETE` | `/api/contacts/:id` | Public | Delete an inquiry |

### Inquiry Statuses

| Status | Description |
|--------|-------------|
| `NEW` | Newly submitted |
| `READ` | Viewed by admin |
| `REPLIED` | Admin responded |
| `CLOSED` | Resolved/closed |

---

## Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/dashboard/stats` | Protected | Aggregated business metrics |

### Response Shape

```json
{
  "totalProducts": 11,
  "totalClients": 3,
  "totalQuotes": 0,
  "totalOrders": 0,
  "pendingQuotes": 0,
  "pendingOrders": 0,
  "totalRevenue": 0,
  "newInquiries": 0,
  "recentQuotes": [],
  "recentOrders": []
}
```

---

## Testimonials

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/testimonials` | Public | List active testimonials |
| `POST` | `/api/testimonials` | Protected | Create a testimonial |
| `PATCH` | `/api/testimonials/:id` | Protected | Update a testimonial |
| `DELETE` | `/api/testimonials/:id` | Protected | Delete a testimonial |

---

## Banners

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/banners` | Public | List active banners |
| `POST` | `/api/banners` | Protected | Create a banner |
| `PATCH` | `/api/banners/:id` | Protected | Update a banner |
| `DELETE` | `/api/banners/:id` | Protected | Delete a banner |

---

## Site Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/settings` | Public | Get all site settings |
| `GET` | `/api/settings/:key` | Public | Get a single setting by key |
| `POST` | `/api/settings` | Protected | Bulk update settings |

### Default Setting Keys

| Key | Example Value |
|-----|---------------|
| `site_name` | Lotus Gift |
| `site_tagline` | Premium Promotional Products & Corporate Gifts |
| `contact_email` | info@lotusgift.com |
| `contact_phone` | +91 9876543210 |
| `whatsapp_number` | +919876543210 |
| `address` | 123 Business Park, Coimbatore, Tamil Nadu 641001 |

---

## Payments (Razorpay)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/payments/create-order/:orderId` | Protected | Create a Razorpay order for an existing order |
| `POST` | `/api/payments/verify` | Protected | Verify Razorpay payment signature |
| `POST` | `/api/payments/convert-quote/:quoteId` | Protected | Convert accepted quote to a payable order |

### Payment Flow

1. Call `create-order/:orderId` to get a Razorpay order ID
2. Open Razorpay checkout in the browser with the returned order ID
3. On payment success, call `verify` with `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`
4. The API validates the signature and updates the order to `CONFIRMED`

---

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| `400` | Validation error or bad request |
| `401` | Not authenticated |
| `403` | Insufficient permissions |
| `404` | Resource not found |
| `500` | Internal server error |
