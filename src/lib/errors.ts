/**
 * Stable, machine-readable API errors. The `code` is part of the public
 * contract — SDKs branch on it, so never rename an existing code.
 */
export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_request"
  | "invalid_recipient"
  | "country_not_allowed"
  | "rate_limited"
  | "insufficient_balance"
  | "not_found"
  | "already_verified"
  | "expired"
  | "max_attempts_exceeded"
  | "all_channels_failed"
  | "internal_error";

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  invalid_request: 400,
  invalid_recipient: 400,
  country_not_allowed: 403,
  rate_limited: 429,
  insufficient_balance: 402,
  not_found: 404,
  already_verified: 409,
  expired: 410,
  max_attempts_exceeded: 429,
  all_channels_failed: 502,
  internal_error: 500,
};

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
  }
  get status() {
    return STATUS[this.code];
  }
}

import { NextResponse } from "next/server";

export function errorResponse(err: unknown, requestId?: string) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...err.details }, request_id: requestId },
      { status: err.status },
    );
  }
  // Never leak internals.
  console.error("[axdox] unhandled error", err);
  return NextResponse.json(
    { error: { code: "internal_error", message: "An unexpected error occurred." }, request_id: requestId },
    { status: 500 },
  );
}
