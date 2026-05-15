import type { IfscCode } from '@repo/types';

import { z } from '../zod.js';

/**
 * IFSC (Indian Financial System Code). 11 chars:
 * `[A-Z]{4}0[A-Z0-9]{6}`.
 *
 * - chars 1–4: bank code (e.g. `SBIN` for State Bank of India)
 * - char 5: literal `0` (reserved by RBI for future use)
 * - chars 6–11: branch identifier (typically numeric but alpha allowed)
 *
 * Citation: https://en.wikipedia.org/wiki/Indian_Financial_System_Code
 * (retrieved 2026-05-15)
 *
 * The schema upper-cases the input at parse boundary.
 */
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const IfscSchema = z
  .string()
  .transform((s) => s.toUpperCase().trim())
  .pipe(z.string().regex(IFSC_REGEX, 'Invalid IFSC (expected AAAA0XXXXXX)'))
  .transform((s): IfscCode => s as IfscCode);
