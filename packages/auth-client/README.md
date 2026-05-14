# `@repo/auth-client`

LotusGift v2's L3 Better-Auth browser SDK. Thin wrapper around `better-auth/client` with the organization + admin plugins pre-configured so consuming Next.js apps don't have to re-declare them.

## Usage

```ts
// apps/web-customer/lib/auth.ts (P16)
import { createLotusGiftAuthClient } from '@repo/auth-client';

export const auth = createLotusGiftAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL!,
});

// React component:
const { data: session } = auth.useSession();
await auth.signIn.email({ email, password });
```

## Server side

Use [`@lotusgift/auth-service`](../../services/auth-service/) instead — it owns the Better-Auth instance + Mongo adapter and is consumed via the api-gateway's `AuthGuard` + `@Session()` decorator.

## L3 placement

Imports `better-auth` (L0 npm). No NestJS, no React, no Next.js — those layers wrap this primitive at L4/L6.
