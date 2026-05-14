import type { Brand } from './brand.js';

/**
 * Branded scalar primitives used across the LotusGift v2 monorepo. Every
 * runtime check + serializer paired with these brands lives in
 * `@repo/validators/scalars`; this module is type-level only.
 */

/**
 * 26-char Crockford base32 ULID (timestamp + random). Canonical domain ID
 * type for every entity exposed to APIs and events. Mongo `_id` stays
 * `ObjectId` at the DB layer; the `id` field exposed to consumers is the
 * ULID.
 *
 * @see https://github.com/ulid/spec
 */
export type UlidString = Brand<string, 'UlidString'>;

/**
 * INR amount in paise (1/100 of a rupee), non-negative integer. Matches
 * Razorpay's wire format and avoids floating-point math. Multi-currency
 * support is parked in `docs/runbooks/scaling-up.md`.
 *
 * @example
 * const oneRupee: InrPaise = 100 as InrPaise;
 * const oneLakh: InrPaise = 10_000_000 as InrPaise;
 */
export type InrPaise = Brand<number, 'InrPaise'>;

/**
 * 15-char India GSTIN — `[state(2)] [PAN(10)] [entitySerial(1)] Z [checksum(1)]`.
 * Regex catches format errors; mod-36 checksum verification is a separate
 * runtime check landed in P6 (`services/vendor-service` KYC).
 *
 * @see https://lookuptax.com/docs/country/india-gst-guidelines-indirect-tax-sales-tax-india
 */
export type GstinIndia = Brand<string, 'GstinIndia'>;

/**
 * India mobile MSISDN in E.164 format — `+91` country code + 10-digit
 * mobile number starting `6-9`.
 *
 * @see https://www.itu.int/rec/T-REC-E.164
 */
export type PhoneIndiaE164 = Brand<string, 'PhoneIndiaE164'>;

/**
 * 6-digit India postal pincode, first digit `1-9` (never `0`).
 *
 * @see https://en.wikipedia.org/wiki/Postal_Index_Number
 */
export type PincodeIndia = Brand<string, 'PincodeIndia'>;

/**
 * Calendar date in `YYYY-MM-DD` (RFC 3339 full-date).
 */
export type IsoDateString = Brand<string, 'IsoDateString'>;

/**
 * Date + time in `YYYY-MM-DDTHH:mm:ss(.sss)?Z` (RFC 3339 date-time with
 * `Z` suffix; all timestamps stored in UTC).
 */
export type IsoDateTimeString = Brand<string, 'IsoDateTimeString'>;

/**
 * Lowercase email address. Schemas downcase at parse time so equality
 * comparisons + DB lookups are case-insensitive without per-callsite work.
 */
export type EmailLowercase = Brand<string, 'EmailLowercase'>;

/**
 * Absolute HTTPS URL. Schemas reject non-HTTPS URLs (no `http://` allowed
 * in payloads to keep CSP + mixed-content guarantees simple).
 */
export type UrlString = Brand<string, 'UrlString'>;

/**
 * Cloudflare R2 object key, slash-separated path under the bucket root.
 * Schemas enforce: no leading slash, no `..`, no double-slash, length
 * ≤1024 bytes.
 */
export type R2ObjectKey = Brand<string, 'R2ObjectKey'>;
