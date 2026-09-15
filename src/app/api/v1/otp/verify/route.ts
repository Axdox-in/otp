import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/security/api-key";
import { clientIp } from "@/lib/security/rate-limit";
import { verifyVerification } from "@/lib/services/verification";
import { ApiError, errorResponse } from "@/lib/errors";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const Body = z.object({
  request_id: z.string().uuid(),
  code: z.string().min(4).max(10),
});

export async function POST(req: Request) {
  const requestId = randomUUID();
  try {
    const auth = await authenticateRequest(req, "otp:verify");
    const json = await req.json().catch(() => {
      throw new ApiError("invalid_request", "Body must be valid JSON.");
    });
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      throw new ApiError("invalid_request", "Invalid request body.", { issues: parsed.error.issues });
    }

    const { status } = await verifyVerification({
      projectId: auth.projectId,
      requestId: parsed.data.request_id,
      code: parsed.data.code,
      ip: clientIp(req),
    });

    const approved = status === "approved" || status === "already_verified";
    return NextResponse.json({ status, verified: approved }, { status: approved ? 200 : 400 });
  } catch (err) {
    return errorResponse(err, requestId);
  }
}
