# Deployment

This guide covers strategies for deploying Lotus Gift to production.

## Build

From the repository root:

```bash
pnpm build
```

This runs Turborepo's `build` task, which builds both apps:
- **Web:** Produces a Next.js build in `apps/web/.next/`
- **API:** Produces compiled JavaScript in `apps/api/dist/`

## Production Environment Variables

Before deploying, ensure all required environment variables are configured. See [Environment Variables](./environment-variables.md) for the full list.

Critical production settings:

```env
# API
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/lotusgift"
BETTER_AUTH_SECRET="<strong-random-secret>"
BETTER_AUTH_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
PORT=3001
RAZORPAY_KEY_ID="<your-razorpay-key>"
RAZORPAY_KEY_SECRET="<your-razorpay-secret>"

# Web
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
```

## Database

MongoDB is schemaless, so no migration step is needed. Mongoose schemas enforce structure at the application level. Ensure your `MONGODB_URI` points to a production MongoDB Atlas cluster or self-hosted instance.

## Deployment Strategies

### Strategy 1: Node.js Server (VPS / VM)

Deploy both apps on a single server using a process manager.

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build
pnpm build

# Start the API
cd apps/api
node dist/src/main.js

# Start the web app (in another process)
cd apps/web
pnpm start
```

Use **PM2** or **systemd** to manage processes:

```bash
# PM2 example
pm2 start apps/api/dist/src/main.js --name "lotusgift-api"
pm2 start npm --name "lotusgift-web" -- start --prefix apps/web
pm2 save
```

Set up **Nginx** as a reverse proxy:

```nginx
# API
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Web
server {
    listen 443 ssl;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Strategy 2: Docker

Create a `Dockerfile` for each app:

**API Dockerfile** (`apps/api/Dockerfile`):

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/ packages/
RUN pnpm install --frozen-lockfile --filter api...

FROM base AS build
WORKDIR /app
COPY --from=deps /app .
COPY apps/api apps/api
COPY packages packages
RUN cd apps/api && pnpm build

FROM base AS production
WORKDIR /app
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/node_modules/.pnpm node_modules/.pnpm
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
```

**Docker Compose** (`docker-compose.yml`):

```yaml
services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    env_file:
      - apps/api/.env

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - apps/web/.env.local
    depends_on:
      - api

```

### Strategy 3: Platform as a Service

**Vercel (Web) + Railway/Render (API):**

1. Deploy `apps/web` to Vercel:
   - Set the root directory to `apps/web`
   - Configure `NEXT_PUBLIC_API_URL` to point to the hosted API

2. Deploy `apps/api` to Railway or Render:
   - Set the build command: `cd apps/api && pnpm build`
   - Set the start command: `node apps/api/dist/src/main.js`
   - Configure all API environment variables

## Database Considerations

### MongoDB Atlas (Recommended for Production)

Use MongoDB Atlas for managed, scalable deployments:

- Create a free or dedicated cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Set `MONGODB_URI` to your Atlas connection string
- Enable IP allowlisting and database user authentication
- Set up regular backups via Atlas (automated daily snapshots)

### Self-Hosted MongoDB

For self-hosted MongoDB:

- Run MongoDB as a replica set for reliability
- Configure authentication and TLS
- Set up regular `mongodump` backups

## SSL/TLS

Always use HTTPS in production:

- Use Let's Encrypt with Certbot for free SSL certificates
- Configure your reverse proxy (Nginx) to handle SSL termination
- Set `BETTER_AUTH_URL` and `FRONTEND_URL` to `https://` URLs
- Ensure cookies have `Secure` flag set (Better Auth does this automatically when the URL uses HTTPS)

## Monitoring

Recommended monitoring setup:

- **Process:** PM2 monitoring or Docker health checks
- **Application:** Add structured logging (e.g., Winston, Pino)
- **Uptime:** External health check on `GET /api`
- **Errors:** Consider Sentry or similar error tracking
- **Performance:** Monitor response times and database query performance
