# Lotus Gift Documentation

**Lotus Gift** is a full-stack corporate gifting and promotional products e-commerce platform. It provides a public product catalog, a client portal for managing quotes and orders, an admin dashboard for business operations, and integrated payment processing via Razorpay.

## Table of Contents

| Document | Description |
|----------|-------------|
| [Getting Started](./getting-started.md) | Installation, setup, and running the project |
| [Architecture](./architecture.md) | Monorepo structure, tech stack, and system design |
| [API Reference](./api-reference.md) | REST API endpoints and usage |
| [Database Schema](./database-schema.md) | Mongoose schemas, enums, and relationships |
| [Authentication](./authentication.md) | Better Auth integration, roles, and guards |
| [Frontend Guide](./frontend-guide.md) | Next.js app structure, pages, and components |
| [Cloudinary](./cloudinary.md) | Image hosting, CDN setup, and upload integration |
| [Environment Variables](./environment-variables.md) | All required and optional env vars |
| [Deployment](./deployment.md) | Production deployment strategies |
| [Contributing](./contributing.md) | Code standards, branching, and workflow |

## Quick Start

```bash
# Clone and install
git clone <repo-url> lotusgift
cd lotusgift
pnpm install

# Set up the database
cd apps/api
cp .env.example .env        # configure MONGODB_URI and BETTER_AUTH_SECRET
pnpm seed

# Start both apps
cd ../..
pnpm dev
```

- **Web app:** http://localhost:3000
- **API server:** http://localhost:3001/api
- **Swagger docs:** http://localhost:3001/api/docs

## Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@lotusgift.com` | `admin123` |
| Client | `client@example.com` | `client123` |

## Tech Stack at a Glance

| Layer | Technology |
|-------|------------|
| Monorepo | Turborepo + pnpm workspaces |
| Frontend | Next.js 16, React 19, Tailwind CSS, TanStack Query |
| Backend | NestJS 11, Mongoose 8, MongoDB |
| Auth | Better Auth with admin plugin |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| Images | Cloudinary (upload, CDN, transforms) |
| Validation | Zod (frontend), class-validator (backend) |
