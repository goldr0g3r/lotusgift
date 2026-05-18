# Payment security

**Audience**: anyone working on `services/payment-service` or Razorpay integration
**Phase**: P9 (Order + Payment) onward
**Last reviewed**: 2026-05-18
**Owner**: @goldr0g3r

## Principles

1. **Never store raw card data** — Razorpay is the PCI-DSS compliant gateway. We only store: `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
2. **Webhook signature verification** — every Razorpay webhook request is verified via HMAC-SHA256 before processing.
3. **Idempotency** — payment state transitions are idempotent. Duplicate webhooks don't create duplicate refunds or duplicate order confirmations.
4. **Raw body capture** — the api-gateway disables body parsing for `/api/payments/webhook` and captures the raw body for signature verification.

## Razorpay webhook flow

```mermaid
sequenceDiagram
    participant R as Razorpay
    participant GW as api-gateway
    participant PS as payment-service
    participant Redis as Upstash Redis

    R->>GW: POST /api/payments/webhook (raw body + X-Razorpay-Signature)
    GW->>GW: Disable body parser; capture raw body
    GW->>PS: Forward raw body + signature header
    PS->>PS: HMAC-SHA256(raw_body, webhook_secret)
    alt Signature valid
        PS->>Redis: Check idempotency key (payment_id)
        alt New event
            PS->>PS: Process payment state transition
            PS->>Redis: Set idempotency key (TTL 24h)
            PS-->>GW: 200 OK
        else Duplicate
            PS-->>GW: 200 OK (no-op)
        end
    else Signature invalid
        PS-->>GW: 401 Unauthorized
    end
```

## Webhook signature verification

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}
```

Key points:
- Use `crypto.timingSafeEqual` — prevents timing attacks
- Use the raw body (Buffer), not the parsed JSON
- `RAZORPAY_WEBHOOK_SECRET` comes from env (never hardcoded)
- Rotate quarterly per [`../runbooks/going-to-production.md`](../runbooks/going-to-production.md)

## Payment state machine

```
created → authorized → captured → settled
                    ↘ failed
captured → refund_initiated → refunded (full/partial)
```

Each transition emits an event via OutboxPort:
- `payment.authorized.v1`
- `payment.captured.v1`
- `payment.failed.v1`
- `payment.refunded.v1`

## What we store vs what Razorpay stores

| Data | Us | Razorpay |
| ---- | -- | -------- |
| Card number | ❌ Never | ✅ Tokenized |
| CVV | ❌ Never | ❌ Not stored |
| UPI VPA | ❌ Never | ✅ For recurring |
| `razorpay_order_id` | ✅ | ✅ |
| `razorpay_payment_id` | ✅ | ✅ |
| `razorpay_signature` | ✅ (verification) | N/A |
| Transaction amount | ✅ | ✅ |
| Payment method type | ✅ (card/upi/netbanking) | ✅ |

## See also

- [`../adr/0001-india-launch-razorpay-and-carrier-aggregator.md`](../adr/0001-india-launch-razorpay-and-carrier-aggregator.md)
- [`data-classification.md`](./data-classification.md)
- [`threat-model.md`](./threat-model.md)
