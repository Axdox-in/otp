/**
 * Common provider contract. Every WhatsApp/SMS/Email adapter implements
 * `SendProvider` so the orchestrator can treat them uniformly and the
 * fallback cascade is channel-agnostic.
 */
export type Channel = "whatsapp" | "sms" | "email";

export interface SendInput {
  /** E.164 phone (whatsapp/sms) or email address (email). */
  to: string;
  /** The plaintext OTP to deliver (never logged/stored). */
  code: string;
  /** Seconds until expiry — surfaced to the user in the message. */
  ttlSeconds: number;
  /** ISO country (for routing/cost). */
  country?: string;
}

export interface SendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  /** Estimated cost in micros (1e-6 currency units) for usage accounting. */
  costMicros?: number;
  latencyMs?: number;
  errorCode?: string;
  errorMessage?: string;
}

export interface SendProvider {
  readonly name: string;
  readonly channel: Channel;
  /** Is this provider configured (env present) and able to serve this recipient? */
  isAvailable(country?: string): boolean;
  send(input: SendInput): Promise<SendResult>;
}

/** Helper to time a send and normalize thrown errors into a failed SendResult. */
export async function runSend(
  provider: string,
  fn: () => Promise<Omit<SendResult, "provider" | "latencyMs" | "success">>,
): Promise<SendResult> {
  const start = Date.now();
  try {
    const r = await fn();
    return { ...r, success: true, provider, latencyMs: Date.now() - start };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return {
      success: false,
      provider,
      latencyMs: Date.now() - start,
      errorCode: err.code ?? "send_failed",
      errorMessage: err.message ?? "Unknown send error",
    };
  }
}
