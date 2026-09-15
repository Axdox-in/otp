import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ApiError } from "@/lib/errors";
import { serverEnv } from "@/lib/env";

export interface AuthedProject {
  apiKeyId: string;
  projectId: string;
  orgId: string;
  env: "test" | "live";
  scopes: string[];
}

function hashKey(fullKey: string): string {
  return createHash("sha256").update(`${serverEnv().API_KEY_PEPPER}:${fullKey}`).digest("hex");
}

/** Generate a new key. Full secret is returned ONCE and never stored. */
export function generateApiKey(env: "test" | "live") {
  const secret = randomBytes(24).toString("base64url");
  const fullKey = `axk_${env}_${secret}`;
  return {
    fullKey,
    keyHash: hashKey(fullKey),
    keyPrefix: fullKey.slice(0, 12),
    lastFour: fullKey.slice(-4),
  };
}

/**
 * Authenticate an incoming request by Authorization: Bearer <key>.
 * Uses the service-role client (RLS-bypass) — this IS the authorization gate.
 */
export async function authenticateRequest(req: Request, requiredScope: string): Promise<AuthedProject> {
  const header = req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(axk_(test|live)_[A-Za-z0-9_-]+)$/);
  if (!match) throw new ApiError("unauthorized", "Missing or malformed API key.");
  const fullKey = match[1];

  const db = supabaseAdmin();
  const { data: key } = await db
    .from("api_keys")
    .select("id, project_id, env, scopes, revoked_at, projects!inner(org_id)")
    .eq("key_hash", hashKey(fullKey))
    .maybeSingle();

  if (!key || key.revoked_at) throw new ApiError("unauthorized", "Invalid or revoked API key.");
  if (!key.scopes.includes(requiredScope)) {
    throw new ApiError("forbidden", `API key lacks required scope: ${requiredScope}`);
  }

  // Fire-and-forget last-used stamp.
  db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id).then(() => {});

  return {
    apiKeyId: key.id,
    projectId: key.project_id,
    // @ts-expect-error supabase nested relation typing
    orgId: key.projects.org_id,
    env: key.env,
    scopes: key.scopes,
  };
}
