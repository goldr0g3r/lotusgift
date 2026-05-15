import { z } from '../zod.js';
import { GstinIndiaSchema } from '../scalars.js';
import type { GstinIndia } from '@repo/types';

/**
 * Inline GSTIN mod-36 checksum validation. The official ICAI algorithm
 * per cite #1/#2 in `docs/research/phase-6-vendor-service.md` (retrieved
 * 2026-05-15):
 *
 *  1. Map each char to a 36-digit alphabet — `'0'-'9' → 0-9`, `'A'-'Z' → 10-35`.
 *  2. For positions 1..14 (1-indexed), multiply the digit by `factor`
 *     where `factor` alternates between 1 and 2 (factor=1 at odd
 *     positions, factor=2 at even positions; counting from position 1).
 *  3. If the product is ≥ 36, replace with `floor(product/36) + (product%36)`
 *     (digit-sum reduction).
 *  4. Sum all 14 mapped values.
 *  5. The expected check char is `(36 - (sum % 36)) % 36`, mapped back
 *     to the 36-char alphabet.
 *
 * The inline implementation avoids depending on `gstin-validator` npm
 * (last published Sept 2020 — fails `.cursor/rules/always-latest-docs.mdc`
 * 14-day freshness rule).
 *
 * Known-good test vector: `27AAPFU0939F1ZV` validates true.
 */

const GSTIN_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Compute the expected 15th-char checksum for a GSTIN's first 14 chars.
 * The caller must already have format-validated the input via
 * `GstinIndiaSchema` (regex-only) before invoking this — passing a
 * non-15-char string throws.
 */
export function computeGstinCheckChar(gstin: string): string {
  if (gstin.length !== 15) {
    throw new Error(`computeGstinCheckChar requires a 15-char GSTIN, got ${gstin.length} chars`);
  }
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const ch = gstin.charAt(i);
    const value = GSTIN_ALPHABET.indexOf(ch);
    if (value < 0) {
      throw new Error(`Invalid GSTIN char "${ch}" at position ${i + 1}`);
    }
    const factor = i % 2 === 0 ? 1 : 2;
    const product = value * factor;
    const reduced = Math.floor(product / 36) + (product % 36);
    sum += reduced;
  }
  const checkValue = (36 - (sum % 36)) % 36;
  const checkChar = GSTIN_ALPHABET.charAt(checkValue);
  if (!checkChar) {
    throw new Error(`Unexpected GSTIN check-value ${checkValue}`);
  }
  return checkChar;
}

/**
 * `true` iff `gstin` is 15 chars + the 15th char matches the computed
 * mod-36 checksum. Returns `false` (not throws) for length mismatch so
 * callers can pair this with `GstinIndiaSchema.safeParse` for a single
 * format-check pass.
 */
export function assertGstinChecksumValid(gstin: string): boolean {
  if (gstin.length !== 15) return false;
  try {
    return computeGstinCheckChar(gstin) === gstin.charAt(14);
  } catch {
    return false;
  }
}

/**
 * Zod schema that runs `GstinIndiaSchema` (regex format check) then
 * applies the mod-36 checksum verification. Use this in onboarding +
 * KYC submission payloads where a malformed checksum should reject.
 *
 * `GstinIndiaSchema` already transforms to the `GstinIndia` brand, so
 * the output of this composed schema is also `GstinIndia`. The
 * `superRefine` lifts the input type (Zod 4 — refinements widen the
 * output position to `unknown` in the type system), so we cast at the
 * export boundary to recover the consumer-facing surface.
 */
const _GstinWithChecksumRaw = GstinIndiaSchema.superRefine((value, ctx) => {
  if (!assertGstinChecksumValid(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'GSTIN checksum (15th char) does not match expected mod-36 value',
    });
  }
});

export const GstinWithChecksumSchema: z.ZodType<GstinIndia, unknown> =
  _GstinWithChecksumRaw as unknown as z.ZodType<GstinIndia, unknown>;
