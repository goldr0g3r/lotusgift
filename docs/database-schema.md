# Database Schema

Lotus Gift uses **Mongoose** with **MongoDB** as the database. Schemas are defined in `apps/api/src/schemas/`.

## Entity Relationship Diagram

```
User ──────┬── Session
           ├── Account
           ├── Quote ────── QuoteItem ──── Product
           └── Order ────── OrderItem ──── Product

Client ──── Quote

Product ──── ProductImage
Product ──── Category

ContactInquiry (standalone)
Testimonial (standalone)
Banner (standalone)
SiteSetting (standalone)
LandingPage (standalone)
```

---

## Enums

### QuoteStatus

| Value | Description |
|-------|-------------|
| `DRAFT` | Quote is being prepared |
| `SENT` | Quote has been sent to the client |
| `ACCEPTED` | Client accepted the quote |
| `REJECTED` | Client rejected the quote |
| `EXPIRED` | Quote validity period has passed |

### OrderStatus

| Value | Description |
|-------|-------------|
| `PENDING` | Awaiting payment or confirmation |
| `CONFIRMED` | Payment received, order confirmed |
| `PROCESSING` | Being prepared for shipment |
| `SHIPPED` | Order is in transit |
| `DELIVERED` | Order has been delivered |
| `CANCELLED` | Order was cancelled |

### InquiryStatus

| Value | Description |
|-------|-------------|
| `NEW` | Newly submitted inquiry |
| `READ` | Viewed by admin |
| `REPLIED` | Admin has responded |
| `CLOSED` | Inquiry is resolved |

---

## Models

### User

Better Auth core table. Stores all registered users (both admins and clients).

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key |
| `email` | String | Unique |
| `emailVerified` | Boolean | Default: `false` |
| `name` | String | Required |
| `image` | String? | Profile image URL |
| `phone` | String? | Custom field |
| `company` | String? | Custom field |
| `role` | String? | Default: `"client"`, admin gets `"admin"` |
| `banned` | Boolean? | Better Auth admin plugin |
| `banReason` | String? | |
| `banExpires` | DateTime? | |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Relations:** `sessions[]`, `accounts[]`, `quotes[]`, `orders[]`

### Session

Better Auth session tracking.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key |
| `token` | String | Unique session token |
| `expiresAt` | DateTime | Session expiry |
| `ipAddress` | String? | |
| `userAgent` | String? | |
| `userId` | String | FK → User |
| `impersonatedBy` | String? | Admin impersonation support |

### Account

Better Auth identity provider accounts.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key |
| `accountId` | String | Provider-specific ID |
| `providerId` | String | e.g., `"credential"` |
| `userId` | String | FK → User |
| `password` | String? | Hashed password (scrypt) |
| `accessToken` | String? | OAuth token |
| `refreshToken` | String? | OAuth refresh token |

### Verification

Better Auth email verification and password reset tokens.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | Primary key |
| `identifier` | String | Email or other identifier |
| `value` | String | Token value |
| `expiresAt` | DateTime | |

---

### Product

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `name` | String | |
| `slug` | String | Unique, URL-friendly |
| `description` | String | Full description |
| `shortDesc` | String? | Brief summary |
| `sku` | String | Unique stock-keeping unit |
| `priceFrom` | Float | Starting price |
| `priceTo` | Float? | Max price (for ranges) |
| `wholesalePrice` | Float? | Bulk order price |
| `wholesaleMinQty` | Int | Min qty for wholesale (default: 10) |
| `categoryId` | String | FK → Category |
| `imageUrl` | String? | Primary image |
| `stock` | Int | Available quantity (default: 0) |
| `minOrderQty` | Int | Minimum order quantity (default: 1) |
| `isActive` | Boolean | Visible in catalog (default: true) |
| `isFeatured` | Boolean | Show on homepage (default: false) |
| `isWholesale` | Boolean | Available for wholesale (default: false) |
| `customizationOptions` | String? | JSON or text describing options |

**Relations:** `category`, `images[]`, `quoteItems[]`, `orderItems[]`

### ProductImage

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `productId` | String | FK → Product (cascade delete) |
| `url` | String | Image URL |
| `alt` | String? | Alt text |
| `sortOrder` | Int | Display order (default: 0) |

### Category

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `name` | String | Unique |
| `slug` | String | Unique, URL-friendly |
| `description` | String? | |
| `imageUrl` | String? | Category image |
| `sortOrder` | Int | Display order (default: 0) |
| `isActive` | Boolean | Default: true |

**Relations:** `products[]`

### Client

B2B client records (separate from User accounts).

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `companyName` | String | |
| `contactName` | String | |
| `email` | String | Unique |
| `phone` | String? | |
| `address` | String? | |
| `city` | String? | |
| `state` | String? | |
| `zipCode` | String? | |
| `notes` | String? | Internal notes |

**Relations:** `quotes[]`

### Quote

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `quoteNumber` | String | Unique, human-readable |
| `clientId` | String? | FK → Client |
| `userId` | String? | FK → User |
| `status` | QuoteStatus | Default: `DRAFT` |
| `subtotal` | Float | Sum of line items |
| `discount` | Float | Default: 0 |
| `tax` | Float | Default: 0 |
| `total` | Float | Final amount |
| `notes` | String? | Client-visible notes |
| `adminNotes` | String? | Internal notes |
| `validUntil` | DateTime? | Quote expiry date |

**Relations:** `client?`, `user?`, `items[]`, `orders[]`

### QuoteItem

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `quoteId` | String | FK → Quote (cascade delete) |
| `productId` | String | FK → Product |
| `quantity` | Int | |
| `unitPrice` | Float | |
| `total` | Float | quantity * unitPrice |
| `customization` | String? | Custom branding details |

### Order

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `orderNumber` | String | Unique, human-readable |
| `userId` | String? | FK → User |
| `quoteId` | String? | FK → Quote (if converted from quote) |
| `status` | OrderStatus | Default: `PENDING` |
| `subtotal` | Float | |
| `discount` | Float | Default: 0 |
| `tax` | Float | Default: 0 |
| `total` | Float | |
| `shippingAddress` | String? | |
| `notes` | String? | |
| `razorpayOrderId` | String? | Razorpay order reference |
| `razorpayPaymentId` | String? | Razorpay payment reference |
| `paidAt` | DateTime? | Payment timestamp |

**Relations:** `user?`, `quote?`, `items[]`

### OrderItem

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `orderId` | String | FK → Order (cascade delete) |
| `productId` | String | FK → Product |
| `quantity` | Int | |
| `unitPrice` | Float | |
| `total` | Float | |

### ContactInquiry

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `name` | String | |
| `email` | String | |
| `phone` | String? | |
| `company` | String? | |
| `subject` | String? | |
| `message` | String | |
| `status` | InquiryStatus | Default: `NEW` |
| `adminNote` | String? | |

### Testimonial

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `clientName` | String | |
| `company` | String? | |
| `content` | String | Testimonial text |
| `rating` | Int | 1-5 (default: 5) |
| `imageUrl` | String? | |
| `isActive` | Boolean | Default: true |
| `sortOrder` | Int | Default: 0 |

### Banner

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `title` | String | |
| `subtitle` | String? | |
| `ctaText` | String? | Call-to-action button text |
| `ctaLink` | String? | Button destination URL |
| `imageUrl` | String? | Banner image |
| `isActive` | Boolean | Default: true |
| `sortOrder` | Int | Default: 0 |

### SiteSetting

Key-value store for site-wide configuration.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `key` | String | Unique setting key |
| `value` | String | Setting value |

### LandingPage

Marketing landing pages with UTM tracking support.

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | CUID primary key |
| `title` | String | |
| `slug` | String | Unique, URL path |
| `heading` | String | Hero heading |
| `subheading` | String? | |
| `content` | String? | Page body content |
| `ctaText` | String? | |
| `ctaLink` | String? | |
| `imageUrl` | String? | |
| `metaTitle` | String? | SEO title |
| `metaDesc` | String? | SEO description |
| `utmSource` | String? | UTM source tracking |
| `utmMedium` | String? | UTM medium tracking |
| `utmCampaign` | String? | UTM campaign tracking |
| `isActive` | Boolean | Default: true |

---

## Cascade Deletes

The following child documents are deleted manually in service code when the parent is removed:
- `ProductImage` → when parent `Product` is deleted
- `QuoteItem` → when parent `Quote` is deleted
- `OrderItem` → when parent `Order` is deleted
