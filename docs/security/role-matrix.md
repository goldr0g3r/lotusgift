# Role + permission matrix

**Audience**: every contributor
**Phase**: P5 (auth-service) onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

Roles managed by Better-Auth Organization plugin. Each user belongs to one or more organizations with a specific role.

## Roles

| Role | App | Description |
| ---- | --- | ----------- |
| `customer` | web-customer | Retail or corporate buyer. Can browse, cart, order, upload recipient-lists. |
| `corporate-admin` | web-customer | Organization admin for a corporate buyer account. Manages team members, payment methods, credit terms. |
| `vendor` | web-vendor | Product listing, inventory management, order fulfilment, RFQ responses. |
| `vendor-admin` | web-vendor | Vendor organization owner. Manages team, payouts, KYC, store settings. |
| `admin` | web-admin | Platform operator. User management, vendor approval, dispute resolution, analytics. |
| `cs-agent` | web-customer-service | Customer service. Read-only on orders, can initiate refunds, escalate issues. |

## Permission matrix

| Permission | customer | corporate-admin | vendor | vendor-admin | admin | cs-agent |
| ---------- | -------- | --------------- | ------ | ------------ | ----- | -------- |
| Browse products | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Place orders | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload recipient-list | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Submit RFQ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Respond to RFQ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Manage products | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Manage inventory | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| View own orders | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View all orders | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Initiate refund | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Approve vendor KYC | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Manage team members | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| View analytics | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Manage promotions | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Access CS console | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |

## Cookie-domain SSO

All 4 apps share a cookie domain via Better-Auth. A user logged into `web-customer` is also logged into `web-admin` if they have the `admin` role. Role-based redirects ensure users land on their appropriate app.

## Organization scoping

- **Corporate buyers**: Organization = company. Members share payment methods, recipient lists, order history.
- **Vendors**: Organization = store. Members share product catalog, inventory, payouts.
- **Platform**: Single organization for admin + CS roles.

## See also

- [`../adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md`](../adr/0007-corporate-gifting-deltas-rfq-customization-recipient-list.md)
- [`threat-model.md`](./threat-model.md)
