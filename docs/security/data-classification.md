# Data classification

**Audience**: every contributor
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Taxonomy for data handled by LotusGift v2. Determines storage, access control, logging, and retention policies.

## Classification levels

| Level | Tag | Description | Examples |
| ----- | --- | ----------- | -------- |
| **Public** | `@public` | Visible to anyone, including unauthenticated users | Product names, descriptions, images, vendor store name, categories |
| **Internal** | `@internal` | Visible to authenticated users with appropriate role | Order history, pricing tiers, stock quantities, vendor analytics |
| **PII** | `@pii` | Personally identifiable information; subject to data protection | Names, email, phone, addresses, recipient-list contents |
| **Sensitive** | `@sensitive` | High-risk data; breach = regulatory/financial consequence | PAN, GSTIN, bank details, KYC documents, Razorpay secrets, session tokens |

## Storage rules

| Level | At rest | In transit | In logs | In analytics |
| ----- | ------- | ---------- | ------- | ------------ |
| `@public` | Plain | HTTPS | Allowed | Allowed |
| `@internal` | Plain | HTTPS | Allowed (no aggregates that reveal vendor strategy) | Allowed (anonymized) |
| `@pii` | Plain (MongoDB Atlas encryption at rest) | HTTPS | **Redacted** | **Stripped** before PostHog/Sentry |
| `@sensitive` | **Encrypted** (R2 server-side encryption for docs; never stored raw for payment data) | HTTPS + field-level encryption where applicable | **Never logged** | **Never sent** |

## Retention

| Data type | Retention | Justification |
| --------- | --------- | ------------- |
| Order records | 8 years | Indian tax compliance (GST audit) |
| Payment records | 8 years | Financial audit trail |
| KYC documents | Vendor lifetime + 5 years after deactivation | Regulatory requirement |
| Recipient-list PII | 90 days after order delivery | No business need; auto-purge |
| Session tokens | 30 days (sliding) | Security best practice |
| Analytics events | 1 year | PostHog Cloud retention |
| Audit logs | 3 years | Dispute resolution |

## Access control by classification

| Level | Who can read | Who can write |
| ----- | ------------ | ------------- |
| `@public` | Anyone | Product owner (vendor) + admin |
| `@internal` | Authenticated user with role | Service owner |
| `@pii` | Data subject + admin + CS (for support) | Data subject + system |
| `@sensitive` | Data subject + admin (with audit log) | System only (automated ingestion) |

## Redaction rules

### Logs
- Replace `@pii` fields with `[REDACTED]` before writing to stdout
- Never log `@sensitive` fields at any level (including debug)

### Analytics (PostHog / Sentry)
- Strip `@pii` fields from event properties
- Use anonymized IDs (hashed user ID) instead of email/phone
- Never send `@sensitive` data to any third-party service

### Error responses
- Never include `@pii` or `@sensitive` data in API error responses
- Use generic messages: "Invalid credentials" not "Password for user@example.com is wrong"

## See also

- [`threat-model.md`](./threat-model.md)
- [`payment-security.md`](./payment-security.md)
- [`.github/instructions/secrets-and-secrets-handling.instructions.md`](../../.github/instructions/secrets-and-secrets-handling.instructions.md)
