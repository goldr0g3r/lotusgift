# Environment Variables

This document lists all environment variables used across the Lotus Gift project.

## API (`apps/api/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | `mongodb://localhost:27017/lotusgift` | MongoDB connection string |
| `BETTER_AUTH_SECRET` | Yes | — | Secret key for signing sessions and tokens. Use a strong random string (32+ characters) |
| `BETTER_AUTH_URL` | No | `http://localhost:3001` | Base URL of the API server (used by Better Auth internally) |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend origin for CORS and Better Auth trusted origins |
| `PORT` | No | `3001` | Port the API server listens on |
| `RAZORPAY_KEY_ID` | No | — | Razorpay API key ID. If not set, payments run in demo mode |
| `RAZORPAY_KEY_SECRET` | No | — | Razorpay API key secret |
| `SMTP_HOST` | No | — | SMTP server hostname for sending emails |
| `SMTP_PORT` | No | — | SMTP server port |
| `SMTP_USER` | No | — | SMTP authentication username |
| `SMTP_PASS` | No | — | SMTP authentication password |
| `MAIL_FROM` | No | — | Default "from" address for outgoing emails |
| `CLOUDINARY_CLOUD_NAME` | No | — | Cloudinary cloud name from dashboard. Required for image uploads |
| `CLOUDINARY_API_KEY` | No | — | Cloudinary API key (numeric). Required for image uploads |
| `CLOUDINARY_API_SECRET` | No | — | Cloudinary API secret. Required for image uploads |

### Notes

- If `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are not set, the payment service operates in demo/mock mode.
- If any SMTP variable is missing, the email service falls back to a JSON transport (logs emails to console instead of sending).
- If any Cloudinary variable is missing, the upload endpoint returns `503 Service Unavailable`. The application still starts normally — only file uploads are disabled. See [Cloudinary](./cloudinary.md) for full setup.

## Web (`apps/web/.env.local`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:3001/api` | Full base URL of the API (including `/api` prefix) |
| `NEXT_PUBLIC_FB_PIXEL_ID` | No | — | Facebook Pixel tracking ID |

### Notes

- `NEXT_PUBLIC_` prefixed variables are exposed to the browser. Do not put secrets here.
- The auth client derives its base URL from `NEXT_PUBLIC_API_URL` by stripping the trailing `/api`.

## Example `.env` File (API)

```env
# Database
MONGODB_URI="mongodb://localhost:27017/lotusgift"

# Auth
BETTER_AUTH_SECRET="replace-with-a-strong-random-secret-at-least-32-chars"
BETTER_AUTH_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Server
PORT=3001

# Payments (optional — leave empty for demo mode)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Email (optional — leave empty for console logging)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
MAIL_FROM=""

# Cloudinary (optional — leave empty to disable image uploads)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

## Example `.env.local` File (Web)

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_FB_PIXEL_ID=""
```

## Production Considerations

- **`BETTER_AUTH_SECRET`** must be a cryptographically random string. Generate one with: `openssl rand -base64 48`
- **`FRONTEND_URL`** and **`BETTER_AUTH_URL`** must use the production domain with HTTPS
- **`NEXT_PUBLIC_API_URL`** should point to the production API endpoint
- Store all secrets in your deployment platform's secret manager, not in committed files
- Never commit `.env` or `.env.local` files to version control
