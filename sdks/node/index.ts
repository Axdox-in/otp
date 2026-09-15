/**
 * AXDOX Verify — official Node SDK
 * npm i @axdox/verify
 */
export interface AxdoxOptions {
  apiKey: string;
  baseUrl?: string;
}

export type Channel = "whatsapp" | "sms" | "email";

export interface SendOptions {
  to: string;
  emailFallback?: string;
  channel?: Channel;
  metadata?: Record<string, unknown>;
}

export interface SendResponse {
  request_id: string;
  status: "pending";
  channel: Channel;
  to: string;
  expires_at: string;
}

export interface VerifyResponse {
  status: "approved" | "denied" | "expired" | "already_verified";
  verified: boolean;
}

export class AxdoxError extends Error {
  constructor(public code: string, message: string, public status: number) {
    super(message);
    this.name = "AxdoxError";
  }
}

export class Axdox {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: AxdoxOptions) {
    if (!opts.apiKey) throw new Error("apiKey is required");
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? "https://api.axdox.com").replace(/\/$/, "");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (json as { error?: { code?: string; message?: string } }).error;
      throw new AxdoxError(err?.code ?? "error", err?.message ?? res.statusText, res.status);
    }
    return json as T;
  }

  /** Start a verification (WhatsApp → SMS → Email fallback). */
  send(opts: SendOptions): Promise<SendResponse> {
    return this.request("POST", "/api/v1/otp/send", {
      to: opts.to,
      email_fallback: opts.emailFallback,
      channel: opts.channel,
      metadata: opts.metadata,
    });
  }

  /** Verify a code the user entered. */
  verify(requestId: string, code: string): Promise<VerifyResponse> {
    return this.request("POST", "/api/v1/otp/verify", { request_id: requestId, code });
  }

  /** Fetch the current status of a verification. */
  status(requestId: string) {
    return this.request("GET", `/api/v1/otp/status?request_id=${encodeURIComponent(requestId)}`);
  }
}

export default Axdox;
