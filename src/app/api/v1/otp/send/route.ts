import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/security/api-key";
import { clientIp } from "@/lib/security/rate-limit";
import { sendVerification } from "@/lib/services/verification";
import { ApiError, errorResponse } from "@/lib/errors";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const Body = z.object({
  to: z.string().min(3).max(320),
  email_fallback: z.string().email().optional(),
  channel: z.enum(["whatsapp", "sms", "email"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const requestId = randomUUID();
  try {
    const auth = await authenticateRequest(req, "otp:send");
    const json = await req.json().catch(() => {
      throw new ApiError("invalid_request", "Body must be valid JSON.");
    });
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      throw new ApiError("invalid_request", "Invalid request body.", { issues: parsed.error.issues });
    }

    const outcome = await sendVerification({
      projectId: auth.projectId,
      to: parsed.data.to,
      emailFallback: parsed.data.email_fallback,
      forceChannel: parsed.data.channel,
      ip: clientIp(req),
      metadata: parsed.data.metadata,
    });

    return NextResponse.json(
      {
        request_id: outcome.requestId,
        status: outcome.status,
        channel: outcome.channel,
        to: outcome.recipientMasked,
        expires_at: outcome.expiresAt,
        // Local-dev convenience only (AXDOX_DEV_ECHO=true). Absent in production.
        ...(outcome.devCode ? { dev_code: outcome.devCode } : {}),
      },
      { status: 202 },
    );
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
