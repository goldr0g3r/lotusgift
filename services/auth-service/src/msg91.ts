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
 * **Configuration validation:** all three of `MSG91_AUTH_KEY`,
 * `MSG91_TEMPLATE_ID`, and `MSG91_SENDER_ID` are required to deliver
 * SMS via MSG91. Partial configuration is treated as a hard error
 * because silently dropping fields would cause every OTP delivery to
 * fail at MSG91's API with a confusing 4xx instead of failing fast
 * with a clear message.
 *
 * **Dev / test fallback:** when ALL three keys are unset (typical for
 * local dev + CI), the helper logs a warn-line and returns instead of
 * throwing. In production, missing-or-partial config throws so the
 * deployer notices immediately.
 *
 * @todo Replace with `@lotusgift/notification-service` once P12 lands
 * so we have a single notification surface for email + SMS + WhatsApp + push.
 */
export async function sendMsg91Otp(env: Env, phone: string, code: string): Promise<void> {
  const config = resolveMsg91Config(env);
  if (config.kind === 'dev-skip') {
    log.warn(
      `MSG91 credentials unset — skipping send-OTP for ${redactPhone(phone)} (OTP would have been ${code.length} digits). Set MSG91_AUTH_KEY/TEMPLATE_ID/SENDER_ID to enable real delivery.`,
    );
    return;
  }
  if (config.kind === 'misconfigured') {
    throw new Error(
      `MSG91 misconfigured: ${config.reason}. All of MSG91_AUTH_KEY, MSG91_TEMPLATE_ID, MSG91_SENDER_ID must be set together.`,
    );
  }

  const body = {
    template_id: config.templateId,
    mobile: stripLeadingPlus(phone),
    otp: code,
    sender: config.senderId,
  };

  const response = await fetch(MSG91_SEND_OTP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: config.authKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '<no body>');
    throw new Error(`MSG91 send-OTP failed for ${redactPhone(phone)}: HTTP ${response.status} ${response.statusText} — ${detail}`);
  }
}

/**
 * Resolve the MSG91 config triple from env. Three outcomes:
 *
 *  - `ready`         — all three vars set; SMS delivery proceeds.
 *  - `dev-skip`      — all three vars unset AND not production; helper
 *                      logs + returns so local dev / CI work without
 *                      paid MSG91 credentials.
 *  - `misconfigured` — partial config OR production with any vars unset;
 *                      helper throws so the deployer notices immediately.
 */
function resolveMsg91Config(
  env: Env,
):
  | { kind: 'ready'; authKey: string; templateId: string; senderId: string }
  | { kind: 'dev-skip' }
  | { kind: 'misconfigured'; reason: string } {
  const authKey = env.MSG91_AUTH_KEY;
  const templateId = env.MSG91_TEMPLATE_ID;
  const senderId = env.MSG91_SENDER_ID;
  const allSet = authKey && templateId && senderId;
  const allUnset = !authKey && !templateId && !senderId;

  if (allSet) {
    return { kind: 'ready', authKey, templateId, senderId };
  }
  if (allUnset && env.NODE_ENV !== 'production') {
    return { kind: 'dev-skip' };
  }
  const missing = [
    !authKey ? 'MSG91_AUTH_KEY' : null,
    !templateId ? 'MSG91_TEMPLATE_ID' : null,
    !senderId ? 'MSG91_SENDER_ID' : null,
  ].filter((v): v is string => v !== null);
  const reason =
    missing.length === 3 && env.NODE_ENV === 'production'
      ? 'all MSG91_* vars unset in production'
      : `missing ${missing.join(', ')}`;
  return { kind: 'misconfigured', reason };
}

function stripLeadingPlus(phone: string): string {
  return phone.startsWith('+') ? phone.slice(1) : phone;
}

function redactPhone(phone: string): string {
  if (phone.length <= 4) return '***';
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}
