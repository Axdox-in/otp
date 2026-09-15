import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: projects } = await db.from("projects").select("id, resend_cooldown_secs").limit(1);
const proj = projects?.[0];
console.log("project:", proj);

const { count: total } = await db.from("otp_requests").select("*", { count: "exact", head: true }).eq("project_id", proj.id);
console.log("total otp_requests for project:", total);

const sinceHr = new Date(Date.now() - 3600e3).toISOString();
const { count: lastHr } = await db.from("otp_requests").select("*", { count: "exact", head: true })
  .eq("project_id", proj.id).gte("created_at", sinceHr);
console.log("otp_requests in last hour:", lastHr);

const { data: ips } = await db.from("otp_requests").select("client_ip").eq("project_id", proj.id).gte("created_at", sinceHr);
const ipCounts = {};
for (const r of ips ?? []) ipCounts[r.client_ip ?? "null"] = (ipCounts[r.client_ip ?? "null"] || 0) + 1;
console.log("by client_ip (last hr):", ipCounts);

for (const ip of [null, "::1", "127.0.0.1"]) {
  const { data, error } = await db.rpc("otp_rate_check", {
    p_project: proj.id, p_recipient: "debug_" + Date.now() + Math.random(), p_ip: ip, p_cooldown_sec: proj.resend_cooldown_secs,
  });
  console.log(`otp_rate_check(fresh recipient, ip=${ip}) ->`, { data, error: error?.message });
}
process.exit(0);
