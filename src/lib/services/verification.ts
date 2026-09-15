import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/errors";
import { parseRecipient } from "@/lib/otp/recipient";
import { generateCode, hashCode, hashRecipient, verifyCode } from "@/lib/otp/crypto";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { whatsappProvider } from "@/lib/providers/whatsapp";
import { selectSmsProvider } from "@/lib/providers/sms";
import { selectEmailProvider } from "@/lib/providers/email";
import { devProvider, devEchoEnabled } from "@/lib/providers/dev";
import type { Channel, SendProvider } from "@/lib/providers/types";

interface ProjectConfig {
  id: string;
  org_id: string;
  channel_order: Channel[];
  otp_length: number;
  otp_ttl_secs: number;
  max_attempts: number;
  resend_cooldown_secs: number;
  allowed_countries: string[];
}

async function loadProject(projectId: string): Promise<ProjectConfig> {
  const { data, error } = await supabaseAdmin()
    .from("projects")
    .select("id, org_id, channel_order, otp_length, otp_ttl_secs, max_attempts, resend_cooldown_secs, allowed_countries")
    .eq("id", projectId)
    .single();
  if (error || !data) throw new ApiError("not_found", "Project not found.");
  return data as ProjectConfig;
}

/** Resolve which provider serves a given channel for a given country. */
function providerFor(channel: Channel, country: string | undefined, simulate: boolean): SendProvider | null {
  // TEST keys (or local dev echo) never send real messages — they simulate
  // delivery and echo the code. This keeps test usage free and makes demos
  // work for any recipient. LIVE keys use the real providers.
  if (simulate) return devProvider(channel);
  let provider: SendProvider | null = null;
  if (channel === "whatsapp") provider = whatsappProvider.isAvailable(country) ? whatsappProvider : null;
  else if (channel === "sms") provider = selectSmsProvider(country);
  else if (channel === "email") provider = selectEmailProvider();
  if (!provider && devEchoEnabled()) provider = devProvider(channel);
  return provider;
}

export interface SendParams {
  projectId: string;
  to: string;              // phone (E.164) or email
  emailFallback?: string;  // optional email for final fallback when `to` is a phone
  ip: string | null;
  forceChannel?: Channel;  // override auto cascade
  simulate?: boolean;      // true for test keys — echo the code, never send real
  metadata?: Record<string, unknown>;
}

export interface SendOutcome {
  requestId: string;
  status: "pending";
  channel: Channel;
  recipientMasked: string;
  expiresAt: string;
  /** Present ONLY in local dev with AXDOX_DEV_ECHO=true — never in production. */
  devCode?: string;
}

/**
 * Create a verification and deliver the code via the first working channel.
 * Cascade order comes from the project (default whatsapp → sms → email).
 */
export async function sendVerification(p: SendParams): Promise<SendOutcome> {
  const db = supabaseAdmin();
  const project = await loadProject(p.projectId);

  const primary = parseRecipient(p.to);
  const country = primary.kind === "phone" ? primary.country : undefined;

  if (project.allowed_countries.length && country && !project.allowed_countries.includes(country)) {
    throw new ApiError("country_not_allowed", `Country ${country} is not enabled for this project.`);
  }

  // Rate-limit on the primary recipient + IP (pumping guard).
  const recipientHash = hashRecipient(primary.kind === "phone" ? primary.e164 : primary.address);
  await enforceRateLimit({
    projectId: project.id,
    recipientHash,
    ip: p.ip,
    cooldownSecs: project.resend_cooldown_secs,
  });

  // Build the ordered delivery plan: (channel, address) pairs.
  const order: Channel[] = p.forceChannel ? [p.forceChannel] : project.channel_order;
  const plan: Array<{ channel: Channel; to: string }> = [];
  for (const channel of order) {
    if (channel === "email") {
      const addr = primary.kind === "email" ? primary.address : p.emailFallback;
      if (addr) plan.push({ channel, to: addr });
    } else {
      // whatsapp / sms need a phone
      if (primary.kind === "phone") plan.push({ channel, to: primary.e164 });
    }
  }
  if (plan.length === 0) throw new ApiError("invalid_request", "No channel can serve this recipient.");

  // Create the pending request first so we can bind the code hash to its id.
  const code = generateCode(project.otp_length);
  const expiresAt = new Date(Date.now() + project.otp_ttl_secs * 1000).toISOString();
  const { data: reqRow, error: insErr } = await db
    .from("otp_requests")
    .insert({
      project_id: project.id,
      status: "pending",
      recipient_hash: recipientHash,
      recipient_masked: primary.masked,
      country,
      code_hash: "pending", // set after we know the id
      code_length: project.otp_length,
      max_attempts: project.max_attempts,
      expires_at: expiresAt,
      client_ip: p.ip,
      metadata: p.metadata ?? {},
    })
    .select("id")
    .single();
  if (insErr || !reqRow) throw new ApiError("internal_error", "Could not create verification.");

  const requestId = reqRow.id as string;
  await db.from("otp_requests").update({ code_hash: hashCode(code, requestId) }).eq("id", requestId);

  // Run the cascade.
  let delivered: { channel: Channel } | null = null;
  const simulate = p.simulate ?? false;
  for (const step of plan) {
    const provider = providerFor(step.channel, country, simulate);
    if (!provider) continue; // no configured provider for this channel — skip

    const result = await provider.send({
      to: step.to,
      code,
      ttlSeconds: project.otp_ttl_secs,
      country,
    });

    await db.from("provider_logs").insert({
      otp_request_id: requestId,
      project_id: project.id,
      channel: step.channel,
      provider: provider.name,
      provider_message_id: result.providerMessageId,
      status: result.success ? "accepted" : "failed",
      cost_micros: result.costMicros ?? 0,
      error_code: result.errorCode,
      error_message: result.errorMessage,
      latency_ms: result.latencyMs,
    });

    if (result.success) {
      await db.from("usage_logs").insert({
        org_id: project.org_id,
        project_id: project.id,
        otp_request_id: requestId,
        channel: step.channel,
        event: "sent",
        cost_micros: result.costMicros ?? 0,
        country,
      });
      delivered = { channel: step.channel };
      break;
    }
  }

  if (!delivered) {
    await db.from("otp_requests").update({ status: "failed" }).eq("id", requestId);
    throw new ApiError("all_channels_failed", "Could not deliver the code on any channel.");
  }

  await db.from("otp_requests").update({ channel_used: delivered.channel }).eq("id", requestId);

  return {
    requestId,
    status: "pending",
    channel: delivered.channel,
    recipientMasked: primary.masked,
    expiresAt,
    devCode: devEchoEnabled() || simulate ? code : undefined,
  };
}

export interface VerifyParams {
  projectId: string;
  requestId: string;
  code: string;
  ip: string | null;
}

export type VerifyStatus = "approved" | "denied" | "expired" | "already_verified";

export async function verifyVerification(p: VerifyParams): Promise<{ status: VerifyStatus }> {
  const db = supabaseAdmin();
  const { data: reqRow } = await db
    .from("otp_requests")
    .select("id, project_id, status, code_hash, attempts, max_attempts, expires_at")
    .eq("id", p.requestId)
    .eq("project_id", p.projectId)
    .maybeSingle();

  if (!reqRow) throw new ApiError("not_found", "Verification not found.");
  if (reqRow.status === "verified") return { status: "already_verified" };
  if (reqRow.status !== "pending") throw new ApiError("expired", "Verification is no longer active.");
  if (new Date(reqRow.expires_at) < new Date()) {
    await db.from("otp_requests").update({ status: "expired" }).eq("id", reqRow.id);
    return { status: "expired" };
  }
  if (reqRow.attempts >= reqRow.max_attempts) {
    await db.from("otp_requests").update({ status: "failed" }).eq("id", reqRow.id);
    throw new ApiError("max_attempts_exceeded", "Too many incorrect attempts.");
  }

  const ok = verifyCode(p.code, reqRow.id, reqRow.code_hash);
  await db.from("otp_attempts").insert({ otp_request_id: reqRow.id, success: ok, client_ip: p.ip });
  await db.from("otp_requests").update({ attempts: reqRow.attempts + 1 }).eq("id", reqRow.id);

  if (!ok) return { status: "denied" };

  await db
    .from("otp_requests")
    .update({ status: "verified", verified_at: new Date().toISOString() })
    .eq("id", reqRow.id);

  // Usage: count a billable verification.
  const project = await loadProject(p.projectId);
  await db.from("usage_logs").insert({
    org_id: project.org_id,
    project_id: p.projectId,
    otp_request_id: reqRow.id,
    channel: "whatsapp", // channel_used is recorded separately on the request
    event: "verified",
  });

  return { status: "approved" };
}

export async function getStatus(projectId: string, requestId: string) {
  const { data } = await supabaseAdmin()
    .from("otp_requests")
    .select("id, status, channel_used, recipient_masked, attempts, max_attempts, expires_at, created_at, verified_at")
    .eq("id", requestId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data) throw new ApiError("not_found", "Verification not found.");
  return data;
}
