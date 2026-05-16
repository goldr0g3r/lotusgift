import type { HsnCode } from '@repo/types';

import { z } from '../zod.js';

/**
 * India GST HSN code — 4-8 digit numeric. Per India GST law: 4-digit
 * heading mandatory for B2B vendors with annual turnover ≤₹5 Cr; 6-digit
 * sub-heading mandatory above ₹5 Cr; 8-digit national classification
 * for import/export invoices. We accept the full 4-8 range at
 * product-create time; P13 tax-service performs the live CBIC registry
 * validation at order-line tax-compute time so the wrong-HSN error
 * surfaces at order-placement (where it's actionable) rather than
 * product-creation (where the vendor can't easily re-verify).
 *
 * Source: https://ondemandint.com/blog/add-hsn-code-on-gst-portal/
 */
export const HsnCodeSchema = z
  .string()
  .regex(/^\d{4,8}$/, 'HSN code must be 4-8 digits (numeric)')
  .transform((s): HsnCode => s as HsnCode);
