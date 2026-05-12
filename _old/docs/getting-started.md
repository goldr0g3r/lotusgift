# Getting Started

## Prerequisites

- **Node.js** >= 18
- **pnpm** 9 (`corepack enable && corepack prepare pnpm@9 --activate`)
- **Git**

## Installation

```bash
git clone <repo-url> lotusgift
cd lotusgift
pnpm install
```

This installs dependencies for all workspace packages in a single step.

## Project Structure

```
lotusgift/
├── apps/
│   ├── api/            # NestJS backend (port 3001)
│   └── web/            # Next.js frontend (port 3000)
├── packages/
│   ├── eslint-config/  # Shared ESLint configuration
│   ├── typescript-config/ # Shared tsconfig bases
│   └── ui/             # @repo/ui shared React components
├── turbo.json          # Turborepo task configuration
├── pnpm-workspace.yaml # Workspace definition
└── package.json        # Root scripts and dev dependencies
```

## Database Setup

The API uses **MongoDB** via Mongoose. Configure the connection URI in `apps/api/.env`:

```env
MONGODB_URI="mongodb://localhost:27017/lotusgift"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
```

Then seed the database:

```bash
cd apps/api
pnpm seed
```

The seed script creates:
- An admin user (`admin@lotusgift.com` / `admin123`)
- A demo client user (`client@example.com` / `client123`)
- 8 product categories
- 11 sample products across all categories
- 3 sample B2B clients
- 3 testimonials
- 2 homepage banners
- Default site settings

## Running the Project

### All apps simultaneously (recommended)

From the repository root:

```bash
pnpm dev
```

Turborepo runs both `apps/api` and `apps/web` in parallel with persistent mode.

### Individual apps

```bash
# API only
cd apps/api
pnpm dev          # starts on port 3001

# Web only
cd apps/web
pnpm dev          # starts on port 3000
```

## Verifying the Setup

1. Open http://localhost:3000 to see the public storefront
2. Open http://localhost:3001/api to verify the API health check
3. Open http://localhost:3001/api/docs for interactive Swagger documentation
4. Log in at http://localhost:3000/admin/login with admin credentials
5. Log in at http://localhost:3000/portal/login with client credentials

## Build

```bash
# Build all apps
pnpm build

# Build a specific app
cd apps/web && pnpm build
cd apps/api && pnpm build
```

## Lint and Type Check

```bash
pnpm lint          # ESLint across all workspaces
pnpm check-types   # TypeScript type checking
pnpm format        # Prettier formatting
```

## Database Commands

```bash
cd apps/api

# Seed the database
pnpm seed

# Connect to MongoDB shell (for debugging)
mongosh mongodb://localhost:27017/lotusgift

# Drop and re-seed the database
mongosh mongodb://localhost:27017/lotusgift --eval "db.dropDatabase()"
pnpm seed
```
