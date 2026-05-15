import type { Brand } from './brand.js';

/**
 * India-specific shared constants + types: ISO 3166-2:IN state + UT
 * codes, vendor + warehouse + KYC discriminators, and 3 branded scalars
 * used by vendor + tax + shipping services downstream.
 *
 * Note on layer placement: `@repo/types` is the L1 type-vocabulary
 * package per `.cursor/rules/architecture-layers.mdc`. Most existing
 * modules in this package are type-level only, but this file deliberately
 * ships paired runtime `const` arrays alongside the literal-union types
 * (e.g. `IN_STATE_CODES` next to `InStateCode`). Reasoning:
 *
 *  - Zod parsers in `@repo/validators/vendor/india.ts` consume the same
 *    arrays via `z.enum(IN_STATE_CODES)` — keeping the array here is the
 *    only way to guarantee the type and the parser cover the exact same
 *    set of values.
 *  - Display-name lookups (`IN_STATE_NAMES`) belong adjacent to the codes
 *    they describe.
 *
 * The runtime values are tiny constant arrays + a Record — there's no
 * business logic in this file. If you need to add runtime logic, push
 * it to `@repo/validators` (L1 with Zod) or `@repo/utils` (L2) instead.
 *
 * Citations (retrieval-dated 2026-05-15):
 * - ISO 3166-2:IN (28 states + 8 UTs):
 *   https://en.wikipedia.org/wiki/ISO_3166-2:IN
 * - PAN 4th-character entity kinds:
 *   https://www.incometaxindia.gov.in/w/how-pan-is-formed-and-how-it-gets-its-unique-identity-
 */

/**
 * ISO 3166-2:IN subdivision codes — 28 states + 8 union territories.
 * Post-2019 J&K split into IN-JK + IN-LA reflected. Post-2020
 * Dadra-Nagar-Haveli + Daman-Diu merger into IN-DH reflected.
 *
 * Ordering: alphabetical within each group (states first, then UTs).
 */
export const IN_STATE_CODES = [
  // 28 states (alphabetical)
  'IN-AP', // Andhra Pradesh
  'IN-AR', // Arunachal Pradesh
  'IN-AS', // Assam
  'IN-BR', // Bihar
  'IN-CT', // Chhattisgarh
  'IN-GA', // Goa
  'IN-GJ', // Gujarat
  'IN-HR', // Haryana
  'IN-HP', // Himachal Pradesh
  'IN-JH', // Jharkhand
  'IN-KA', // Karnataka
  'IN-KL', // Kerala
  'IN-MP', // Madhya Pradesh
  'IN-MH', // Maharashtra
  'IN-MN', // Manipur
  'IN-ML', // Meghalaya
  'IN-MZ', // Mizoram
  'IN-NL', // Nagaland
  'IN-OR', // Odisha
  'IN-PB', // Punjab
  'IN-RJ', // Rajasthan
  'IN-SK', // Sikkim
  'IN-TN', // Tamil Nadu
  'IN-TG', // Telangana
  'IN-TR', // Tripura
  'IN-UP', // Uttar Pradesh
  'IN-UT', // Uttarakhand
  'IN-WB', // West Bengal
  // 8 union territories
  'IN-AN', // Andaman and Nicobar Islands
  'IN-CH', // Chandigarh
  'IN-DH', // Dadra and Nagar Haveli and Daman and Diu (merged 2020)
  'IN-DL', // Delhi (National Capital Territory)
  'IN-JK', // Jammu and Kashmir
  'IN-LA', // Ladakh
  'IN-LD', // Lakshadweep
  'IN-PY', // Puducherry
] as const;

/**
 * ISO 3166-2:IN subdivision code (28 states + 8 UTs). Used as the
 * warehouse address state field across vendor + shipping + tax services.
 */
export type InStateCode = (typeof IN_STATE_CODES)[number];

/**
 * Display-name lookup for ISO 3166-2:IN codes. Apps use this when
 * surfacing the state name in the warehouse picker + admin UI.
 */
export const IN_STATE_NAMES: Readonly<Record<InStateCode, string>> = {
  'IN-AP': 'Andhra Pradesh',
  'IN-AR': 'Arunachal Pradesh',
  'IN-AS': 'Assam',
  'IN-BR': 'Bihar',
  'IN-CT': 'Chhattisgarh',
  'IN-GA': 'Goa',
  'IN-GJ': 'Gujarat',
  'IN-HR': 'Haryana',
  'IN-HP': 'Himachal Pradesh',
  'IN-JH': 'Jharkhand',
  'IN-KA': 'Karnataka',
  'IN-KL': 'Kerala',
  'IN-MP': 'Madhya Pradesh',
  'IN-MH': 'Maharashtra',
  'IN-MN': 'Manipur',
  'IN-ML': 'Meghalaya',
  'IN-MZ': 'Mizoram',
  'IN-NL': 'Nagaland',
  'IN-OR': 'Odisha',
  'IN-PB': 'Punjab',
  'IN-RJ': 'Rajasthan',
  'IN-SK': 'Sikkim',
  'IN-TN': 'Tamil Nadu',
  'IN-TG': 'Telangana',
  'IN-TR': 'Tripura',
  'IN-UP': 'Uttar Pradesh',
  'IN-UT': 'Uttarakhand',
  'IN-WB': 'West Bengal',
  'IN-AN': 'Andaman and Nicobar Islands',
  'IN-CH': 'Chandigarh',
  'IN-DH': 'Dadra and Nagar Haveli and Daman and Diu',
  'IN-DL': 'Delhi',
  'IN-JK': 'Jammu and Kashmir',
  'IN-LA': 'Ladakh',
  'IN-LD': 'Lakshadweep',
  'IN-PY': 'Puducherry',
};

/**
 * Warehouse owner kind. `vendor` is the only MVP value; `platform` is
 * forward-compat for FBA-style platform-owned warehouses (parked to
 * `docs/runbooks/scaling-up.md`). Controller-layer enforcement at MVP
 * rejects `platform` at create time but the schema accepts both so
 * existing rows survive future activation.
 */
export const WAREHOUSE_OWNER_TYPES = ['vendor', 'platform'] as const;
export type WarehouseOwnerType = (typeof WAREHOUSE_OWNER_TYPES)[number];

/**
 * Vendor subscription-tier keys. Per-tier monetary pricing lives in
 * promotions-service (P14); per-tier warehouse caps + commission lookup
 * live in vendor-service (P6).
 */
export const VENDOR_TIER_KEYS = ['STARTER', 'GROWTH', 'ENTERPRISE'] as const;
export type VendorTierKey = (typeof VENDOR_TIER_KEYS)[number];

/**
 * Vendor lifecycle status. `DRAFT` covers in-progress onboarding wizards
 * that haven't completed step 6 yet. `PENDING_REVIEW` means the vendor
 * submitted the final wizard step + the admin-approval queue owns the
 * next move. `ACTIVATED` unblocks product creation (P7) + order routing
 * (P9). `REJECTED` + `SUSPENDED` shed admin-revocation paths.
 */
export const VENDOR_STATUS_KEYS = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVATED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type VendorStatus = (typeof VENDOR_STATUS_KEYS)[number];

/**
 * KYC submission decision status. `PENDING` is the just-submitted default;
 * `IN_REVIEW` is set when an admin starts reviewing; `APPROVED` /
 * `REJECTED` are terminal.
 */
export const KYC_STATUS_KEYS = ['PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED'] as const;
export type KycStatusKey = (typeof KYC_STATUS_KEYS)[number];

/**
 * PAN 4th-character entity-kind codes per Income Tax India PAN structure.
 *
 * - P = Individual / Person
 * - C = Company
 * - H = Hindu Undivided Family (HUF)
 * - F = Firm / LLP
 * - A = Association of Persons (AOP)
 * - T = Trust
 * - B = Body of Individuals (BOI)
 * - L = Local Authority
 * - J = Artificial Juridical Person
 * - G = Government Agency
 */
export const PAN_ENTITY_KINDS = [
  'P',
  'C',
  'H',
  'F',
  'A',
  'T',
  'B',
  'L',
  'J',
  'G',
] as const;
export type PanEntityKind = (typeof PAN_ENTITY_KINDS)[number];

/**
 * Weekday key for per-warehouse operating-hours + per-carrier pickup
 * cutoffs. Lowercase 3-letter abbreviations.
 */
export const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

/**
 * Carrier identifiers used by warehouse pickup-cutoff config (P6) and
 * the shipping-service adapters (P11). Lower-case for URL + config key
 * consistency.
 */
export const CARRIER_KEYS = ['shiprocket', 'delhivery', 'bluedart'] as const;
export type CarrierKey = (typeof CARRIER_KEYS)[number];

/**
 * Fixed IST timezone constant. P6 warehouse operating-hours are
 * interpreted in `Asia/Kolkata`; multi-timezone support is parked to
 * `docs/runbooks/scaling-up.md`.
 */
export const IST_TIMEZONE = 'Asia/Kolkata' as const;
export type IstTimezone = typeof IST_TIMEZONE;

/**
 * India PAN — 10 chars: `[A-Z]{3}[PCHFATBLJG][A-Z][0-9]{4}[A-Z]`.
 * Branded so the compiler stops accidental string-to-PAN coercion.
 */
export type PanIndia = Brand<string, 'PanIndia'>;

/**
 * IFSC — 11 chars: `[A-Z]{4}0[A-Z0-9]{6}`. Branded to prevent string
 * mixups with PAN / GSTIN.
 */
export type IfscCode = Brand<string, 'IfscCode'>;

/**
 * UPI VPA (Virtual Payment Address) — `<identifier>@<provider>`. Branded
 * + lower-cased at parse time.
 */
export type UpiVpa = Brand<string, 'UpiVpa'>;
