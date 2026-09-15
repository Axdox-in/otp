/**
 * One-shot setup: creates an organization + project + a test API key for an
 * existing signed-up user, using the Supabase service role.
 *
 * Prereqs: migrations applied, and you've registered + confirmed your email.
 * Run:  node scripts/seed.mjs you@example.com
 */
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// --- load .env.local (no dependency needed) ---
function loadEnv(path = ".env.local") {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    console.error("Could not read .env.local"); process.exit(1);
  }
}
loadEnv();

const email = process.argv[2];
if (!email) { console.error("Usage: node scripts/seed.mjs you@example.com"); process.exit(1); }

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pepper = process.env.API_KEY_PEPPER;
if (!url || !serviceKey || !pepper) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / API_KEY_PEPPER in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

// find the auth user by email
const { data: list, error: listErr } = await db.auth.admin.listUsers();
if (listErr) { console.error("listUsers failed:", listErr.message); process.exit(1); }
const user = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) { console.error(`No user found for ${email}. Register + confirm your email first.`); process.exit(1); }

// ensure public.users row (the trigger usually creates it)
await db.from("users").upsert({ id: user.id, email: user.email }, { onConflict: "id" });

// org (reuse if the user already owns one)
let orgId;
const { data: existingMember } = await db.from("members").select("org_id").eq("user_id", user.id).limit(1).maybeSingle();
if (existingMember) {
  orgId = existingMember.org_id;
  console.log("Using existing organization:", orgId);
} else {
  const slug = "acme-" + randomBytes(3).toString("hex");
  const { data: org, error } = await db.from("organizations").insert({ name: "Acme Inc", slug }).select("id").single();
  if (error) { console.error("org insert failed:", error.message); process.exit(1); }
  orgId = org.id;
  await db.from("members").insert({ org_id: orgId, user_id: user.id, role: "owner" });
  console.log("Created organization:", orgId);
}

// project
const { data: project, error: projErr } = await db.from("projects").insert({ org_id: orgId, name: "Default project" }).select("id").single();
if (projErr) { console.error("project insert failed:", projErr.message); process.exit(1); }
console.log("Created project:", project.id);

// api key (matches src/lib/security/api-key.ts hashing)
const fullKey = `axk_test_${randomBytes(24).toString("base64url")}`;
const keyHash = createHash("sha256").update(`${pepper}:${fullKey}`).digest("hex");
const { error: keyErr } = await db.from("api_keys").insert({
  project_id: project.id, name: "seed", env: "test",
  key_prefix: fullKey.slice(0, 12), key_hash: keyHash, last_four: fullKey.slice(-4),
  created_by: user.id,
});
if (keyErr) { console.error("api key insert failed:", keyErr.message); process.exit(1); }

console.log("\n✅ Setup complete. Your test API key (save it — shown once):\n");
console.log("   " + fullKey + "\n");
console.log("Try it:\n");
console.log(`  curl -X POST http://localhost:3003/api/v1/otp/send \\
    -H "Authorization: Bearer ${fullKey}" \\
    -H "Content-Type: application/json" \\
    -d '{"to":"${email}"}'\n`);
