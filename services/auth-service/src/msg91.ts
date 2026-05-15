import { Logger } from '@nestjs/common';

import type { Env } from '@repo/config';

const log = new Logger('Msg91');

/**
 * MSG91 send-OTP REST endpoint.
 *
 * Source: <https://docs.msg91.com/otp> (retrieved 2026-05-15).
 */
const MSG91_SEND_OTP_URL = 'https://control.msg91.com/api/v5/otp';

/**
 * Send a one-time passcode SMS via MSG91.
 *
 * This is the callback wired into Better-Auth's `phoneNumber` plugin —
 * Better-Auth generates the OTP and persists the verification row; this
 * function only delivers the SMS.
 *
 * **Dev-default behaviour:** when `MSG91_AUTH_KEY` is unset (typical for
 * local dev and CI), the helper logs a warn-line and returns instead of
 * throwing. That keeps local dev usable without paid credentials. CI
 * tests stub `fetch` directly so they don't hit this branch.
 *
 * @todo Replace with `@repo/notification-service` once P12 lands so we
 * have a single notification surface for email + SMS + WhatsApp + push.
 */
export async function sendMsg91Otp(env: Env, phone: string, code: string): Promise<void> {
  if (!env.MSG91_AUTH_KEY) {
    log.warn(
      `MSG91_AUTH_KEY unset — skipping send-OTP for ${redactPhone(phone)} (OTP would have been ${code.length} digits). Set MSG91_AUTH_KEY in env to enable real delivery.`,
    );
    return;
  }

  const body = {
    template_id: env.MSG91_TEMPLATE_ID,
    mobile: stripLeadingPlus(phone),
    otp: code,
    sender: env.MSG91_SENDER_ID,
  };

  const response = await fetch(MSG91_SEND_OTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '<no body>');
    throw new Error(`MSG91 send-OTP failed for ${redactPhone(phone)}: HTTP ${response.status} ${response.statusText} — ${detail}`);
  }
}

function stripLeadingPlus(phone: string): string {
  return phone.startsWith('+') ? phone.slice(1) : phone;
}

function redactPhone(phone: string): string {
  if (phone.length <= 4) return '***';
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}
