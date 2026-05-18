# Security

**Audience**: every contributor
**Phase**: P0 onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Security posture for LotusGift v2. The platform handles Indian personal data (PAN, phone, address), payment information (Razorpay tokens), and vendor business data (GSTIN, bank details). Security failures = customer-trust catastrophe + regulatory liability.

## Catalogue

- [`threat-model.md`](./threat-model.md) — STRIDE-style threat model + mitigations.
- [`role-matrix.md`](./role-matrix.md) — Roles + permissions matrix per Better-Auth Organization plugin.
- [`data-classification.md`](./data-classification.md) — `@public` / `@internal` / `@pii` / `@sensitive` taxonomy + retention.
- [`payment-security.md`](./payment-security.md) — Razorpay integration security: webhook signing, idempotency, no raw PAN storage.

## Security principles

1. **No secrets in code** — `.env*` files git-ignored; gitleaks in CI; secrets in GitHub Environments / Vercel / Oracle systemd. See [`secrets-and-secrets-handling`](../../.github/instructions/secrets-and-secrets-handling.instructions.md).
2. **Zod at every boundary** — all external input validated via Zod before processing. No `any` casts on user input.
3. **Auth on every endpoint** — Better-Auth guards on all non-public routes. Organization-scoped access for vendor/admin/CS portals.
4. **Razorpay handles PCI** — we never see raw card data. Only store tokenized order/payment IDs.
5. **Webhook signature verification** — Razorpay webhooks verified via HMAC-SHA256 before processing.
6. **Rate limiting** — per-IP and per-user rate limits on auth endpoints (login, OTP, passkey).
7. **CORS strict** — only the 4 known frontend origins allowed.
8. **httpOnly cookies** — session tokens never accessible to JavaScript.
9. **Collection namespacing** — tenant data isolated by vendor/organization at the query level.
10. **Encrypted at rest** — KYC documents encrypted before R2 upload; MongoDB Atlas encryption at rest (M0 default).

## Vulnerability reporting

Solo project — report via GitHub issue with `type/security` + `prio/p0-critical` label, or email directly.

## Review cadence

- **Per PR**: gitleaks scan, ESLint security rules, dep-cruiser boundary checks.
- **Monthly**: review open `type/security` issues.
- **Before launch (P22)**: full OWASP ASVS Level 2 self-assessment per [`../runbooks/going-to-production.md`](../runbooks/going-to-production.md).

## See also

- [`../runbooks/incident-response.md`](../runbooks/incident-response.md)
- [`../runbooks/going-to-production.md`](../runbooks/going-to-production.md)
- [`.github/instructions/secrets-and-secrets-handling.instructions.md`](../../.github/instructions/secrets-and-secrets-handling.instructions.md)
