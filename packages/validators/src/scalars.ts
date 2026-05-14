import type {
  EmailLowercase,
  GstinIndia,
  InrPaise,
  IsoDateString,
  IsoDateTimeString,
  PhoneIndiaE164,
  PincodeIndia,
  R2ObjectKey,
  UlidString,
  UrlString,
} from '@repo/types';

import { z } from './zod.js';

/**
 * Runtime parsers for the branded scalars declared in `@repo/types/scalars`.
 * Every schema's `z.infer<typeof ...Schema>` aligns with its paired brand
 * via a `.transform()` cast.
 */

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE_INDIA_E164_REGEX = /^\+91[6-9]\d{9}$/;
const PINCODE_INDIA_REGEX = /^[1-9]\d{5}$/;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 26-char Crockford base32 ULID. Case-insensitive at the spec level but we
 * normalize to UPPERCASE at the parse boundary so equality + indexing are
 * deterministic.
 *
 * @see https://github.com/ulid/spec
 */
export const UlidSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(ULID_REGEX, 'Invalid ULID'))
  .transform((s): UlidString => s as UlidString);

/**
 * INR amount in paise — non-negative integer. Matches Razorpay's wire
 * format.
 */
export const InrPaiseSchema = z
  .number()
  .int('INR amount must be an integer in paise')
  .nonnegative('INR amount must be non-negative')
  .transform((n): InrPaise => n as InrPaise);

/**
 * 15-char India GSTIN. Regex catches format errors; mod-36 checksum
 * verification is a separate runtime check landed in P6
 * (`services/vendor-service` KYC).
 *
 * @see https://lookuptax.com/docs/country/india-gst-guidelines-indirect-tax-sales-tax-india
 */
export const GstinIndiaSchema = z
  .string()
  .transform((s) => s.toUpperCase())
  .pipe(z.string().regex(GSTIN_REGEX, 'Invalid GSTIN format'))
  .transform((s): GstinIndia => s as GstinIndia);

/**
 * India mobile MSISDN in E.164 format.
 *
 * @see https://www.itu.int/rec/T-REC-E.164
 */
export const PhoneIndiaE164Schema = z
  .string()
  .regex(PHONE_INDIA_E164_REGEX, 'Invalid India mobile number (expected +91XXXXXXXXXX)')
  .transform((s): PhoneIndiaE164 => s as PhoneIndiaE164);

/**
 * 6-digit India postal pincode, first digit `1-9`.
 *
 * @see https://en.wikipedia.org/wiki/Postal_Index_Number
 */
export const PincodeIndiaSchema = z
  .string()
  .regex(PINCODE_INDIA_REGEX, 'Invalid India pincode (expected 6 digits, first 1-9)')
  .transform((s): PincodeIndia => s as PincodeIndia);

/**
 * RFC 3339 full-date (`YYYY-MM-DD`).
 */
export const IsoDateSchema = z
  .string()
  .regex(ISO_DATE_REGEX, 'Invalid ISO date (expected YYYY-MM-DD)')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    if (Number.isNaN(d.getTime())) return false;
    // JS Date rolls over impossible dates (e.g. 2026-02-30 → 2026-03-02);
    // round-trip back to ISO and compare to catch the rollover.
    return d.toISOString().slice(0, 10) === s;
  }, 'Invalid calendar date')
  .transform((s): IsoDateString => s as IsoDateString);

/**
 * RFC 3339 date-time in UTC (`Z` suffix required).
 */
export const IsoDateTimeSchema = z
  .string()
  .datetime({ message: 'Invalid ISO 8601 date-time' })
  .transform((s): IsoDateTimeString => s as IsoDateTimeString);

/**
 * Lowercase email address; downcased at parse time.
 */
export const EmailLowercaseSchema = z
  .string()
  .email('Invalid email address')
  .transform((s) => s.toLowerCase())
  .transform((s): EmailLowercase => s as EmailLowercase);

/**
 * Absolute HTTPS URL. Rejects non-HTTPS to keep CSP + mixed-content
 * guarantees simple.
 */
export const UrlSchema = z
  .string()
  .url('Invalid URL')
  .refine((s) => s.startsWith('https://'), 'URL must use https://')
  .transform((s): UrlString => s as UrlString);

/**
 * Cloudflare R2 object key. Rejects leading slash, double-slash, `..`,
 * and >1024-byte keys.
 */
export const R2ObjectKeySchema = z
  .string()
  .min(1, 'R2 object key cannot be empty')
  .max(1024, 'R2 object key exceeds 1024 bytes')
  .refine((s) => !s.startsWith('/'), 'R2 object key must not start with /')
  .refine((s) => !s.includes('//'), 'R2 object key must not contain //')
  .refine((s) => !s.split('/').includes('..'), 'R2 object key must not contain ..')
  .transform((s): R2ObjectKey => s as R2ObjectKey);
