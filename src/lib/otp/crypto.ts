import "server-only";
import { createHmac, createHash, randomInt, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/lib/env";

/** Cryptographically secure numeric OTP of the requested length. */
export function generateCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) out += randomInt(0, 10).toString();
  return out;
}

/** HMAC of the code, bound to the request id so a leaked hash can't be reused. */
export function hashCode(code: string, requestId: string): string {
  return createHmac("sha256", serverEnv().OTP_PEPPER)
    .update(`${code}:${requestId}`)
    .digest("hex");
}

/** Constant-time verification. */
export function verifyCode(input: string, requestId: string, storedHash: string): boolean {
  const candidate = hashCode(input, requestId);
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Stable, non-reversible lookup hash for a recipient (rate limits / dedupe). */
export function hashRecipient(normalized: string): string {
  return createHash("sha256")
    .update(`${serverEnv().OTP_PEPPER}:${normalized.toLowerCase()}`)
    .digest("hex");
}
