import type { PanIndia } from '@repo/types';

import { z } from '../zod.js';

/**
 * India PAN (Permanent Account Number). 10 chars:
 * `[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]`.
 *
 * - chars 1–3: alphabetic series (any letter)
 * - char 4: entity-kind code (P=individual, C=company, etc.) per
 *   `@repo/types.PAN_ENTITY_KINDS`
 * - char 5: first letter of surname (individuals) or first letter of
 *   entity name (non-individuals) — not enforced at the validator level
 *   because we don't have the source-of-truth name to compare against
 * - chars 6–9: 4-digit sequential number
 * - char 10: alphabetic check digit (algorithm not public; format-only
 *   validation here)
 *
 * Citation: https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-
 * (retrieved 2026-05-15)
 *
 * The schema upper-cases the input at parse boundary so equality checks
 * are deterministic.
 */
const PAN_REGEX = /^[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]$/;

export const PanSchema = z
  .string()
  .transform((s) => s.toUpperCase().trim())
  .pipe(z.string().regex(PAN_REGEX, 'Invalid PAN format (expected AAAA[PCHFATBLJG]ANNNNA)'))
  .transform((s): PanIndia => s as PanIndia);
