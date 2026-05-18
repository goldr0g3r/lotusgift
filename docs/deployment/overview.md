# Deployment overview

**Audience**: anyone needing to understand the production topology
**Phase**: P5 onward (incremental provisioning)
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Why India-region

Per [`ADR-0005`](../adr/0005-hosting-oracle-mumbai-plus-vercel.md):
- Target market is Indian corporates — latency matters for UPI payment callbacks
- Oracle Always Free Mumbai gives free ARM compute in-region
- MongoDB Atlas M0 supports Mumbai (`ap-south-1`)
- Razorpay requires Indian server for webhook delivery within SLA

## Single-process architecture

LotusGift v2 runs as **one Node.js process** (`apps/api-gateway`) that hosts all 16 service libraries. This is a modular monolith per [`ADR-0004`](../adr/0004-modular-monolith-first.md).

Benefits:
- Free tier friendly (one VM, one process, one cluster)
- In-process event delivery (no message broker cost)
- Simple deployment (one artifact, one systemd unit)
- Easy debugging (one log stream, one trace context)

Split-mode triggers are documented in [`../runbooks/scaling-up.md`](../runbooks/scaling-up.md).

## Subdomain plan

| Subdomain | App | Hosting |
| --------- | --- | ------- |
| `lotusgift.in` | web-customer (redirect) | Vercel |
| `www.lotusgift.in` | web-customer | Vercel |
| `vendor.lotusgift.in` | web-vendor | Vercel |
| `admin.lotusgift.in` | web-admin | Vercel |
| `cs.lotusgift.in` | web-customer-service | Vercel |
| `api.lotusgift.in` | api-gateway | Oracle VM (nginx reverse proxy) |

## Network flow

```
User → Cloudflare DNS → Vercel (frontend) → api.lotusgift.in (Oracle VM)
                                          → Cloudflare DNS → Oracle VM nginx → Node.js :3001
```

- Cloudflare provides DNS + DDoS protection (free plan)
- Vercel handles frontend SSL + edge caching
- Oracle VM runs nginx (SSL via Certbot) reverse-proxying to Node.js

## Deploy pipeline

```
git push → GitHub Actions CI → build + test + lint →
  → docker build (api-gateway) → SSH deploy to Oracle VM
  → Vercel auto-deploys frontends on push to main
```

Detailed in [`ci-cd-pipeline.md`](./ci-cd-pipeline.md) (to be written at P22).

## See also

- [`../adr/0004-modular-monolith-first.md`](../adr/0004-modular-monolith-first.md)
- [`../adr/0005-hosting-oracle-mumbai-plus-vercel.md`](../adr/0005-hosting-oracle-mumbai-plus-vercel.md)
- [`../runbooks/oracle-deploy.md`](../runbooks/oracle-deploy.md)
