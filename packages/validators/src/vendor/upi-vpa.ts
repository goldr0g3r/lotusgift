import type { UpiVpa } from '@repo/types';

import { z } from '../zod.js';

/**
 * UPI VPA (Virtual Payment Address) — `<identifier>@<provider>`.
 *
 * Identifier: 2–256 chars `[a-zA-Z0-9._\-]`.
 * Provider: 2–64 alphabetic chars.
 *
 * Per the GeeksforGeeks UPI-ID regex reference (cite #5 in
 * `docs/research/phase-6-vendor-service.md`, retrieved 2026-05-15).
 *
 * The schema lower-cases the input at parse boundary (UPI VPAs are
 * case-insensitive per NPCI spec; lower-case avoids `Foo@bank` vs
 * `foo@bank` duplicate-handle confusion downstream).
 */
const UPI_VPA_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/;

export const UpiVpaSchema = z
  .string()
  .transform((s) => s.toLowerCase().trim())
  .pipe(z.string().regex(UPI_VPA_REGEX, 'Invalid UPI VPA (expected name@provider)'))
  .transform((s): UpiVpa => s as UpiVpa);
