import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/security/api-key";
import { getStatus } from "@/lib/services/verification";
import { ApiError, errorResponse } from "@/lib/errors";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const requestId = randomUUID();
  try {
    const auth = await authenticateRequest(req, "otp:read");
    const id = new URL(req.url).searchParams.get("request_id");
    if (!id) throw new ApiError("invalid_request", "Missing request_id query parameter.");

    const row = await getStatus(auth.projectId, id);
    return NextResponse.json({
      request_id: row.id,
      status: row.status,
      channel: row.channel_used,
      to: row.recipient_masked,
      attempts: row.attempts,
      max_attempts: row.max_attempts,
      expires_at: row.expires_at,
      verified_at: row.verified_at,
      created_at: row.created_at,
    });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
