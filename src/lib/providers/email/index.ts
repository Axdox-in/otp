import "server-only";
import { type SendProvider } from "../types";
import { resendProvider } from "./resend";
import { sesProvider } from "./ses";
import { sendgridProvider } from "./sendgrid";

/** Email providers in priority order: SES (cheapest) → Resend → SendGrid. */
const ALL: SendProvider[] = [sesProvider, resendProvider, sendgridProvider];

export function selectEmailProvider(): SendProvider | null {
  return ALL.find((p) => p.isAvailable()) ?? null;
}

/** Minimal, deliverability-friendly OTP email (plain + tiny HTML, no links). */
export function renderOtpEmail(code: string, ttlSeconds: number) {
  const mins = Math.round(ttlSeconds / 60);
  const text = `Your verification code is ${code}. It expires in ${mins} minutes. If you didn't request this, ignore this email.`;
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;color:#111">
    <p>Your verification code is:</p>
    <p style="font-size:30px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</p>
    <p style="color:#666">It expires in ${mins} minutes. If you didn't request this, you can ignore this email.</p>
  </div>`;
  return { subject: `${code} is your verification code`, text, html };
}
