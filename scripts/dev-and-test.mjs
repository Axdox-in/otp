/**
 * Self-contained: boots the dev server on a spare port, runs send → verify,
 * prints the result, then shuts the server down. For automated smoke testing.
 * Usage: node scripts/dev-and-test.mjs <api_key> [recipient]
 */
import { spawn } from "node:child_process";

const PORT = 3011;
const base = `http://localhost:${PORT}`;
const key = process.argv[2];
const to = process.argv[3] || "test@example.com";
if (!key) { console.error("Usage: node scripts/dev-and-test.mjs <api_key>"); process.exit(1); }

const child = spawn("npm", ["run", "dev", "--", "-p", String(PORT)], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
child.stdout.on("data", (d) => process.stdout.write("[dev] " + d.toString()));
child.stderr.on("data", (d) => process.stderr.write("[dev] " + d.toString()));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function killTree() {
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { shell: true });
    else child.kill("SIGTERM");
  } catch {}
}

async function waitReady(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(base, { method: "GET" });
      if (r.status) return true;
    } catch {}
    await sleep(1500);
  }
  return false;
}

async function post(path, body) {
  // Retry a few times to ride out first-hit route compilation.
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let json; try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
      if (res.status >= 500 && i < 7) { await sleep(2000); continue; }
      return { status: res.status, json };
    } catch {
      await sleep(2000);
    }
  }
  return { status: 0, json: { error: "no response" } };
}

try {
  console.log(`\nBooting dev server on ${base} (first boot can take ~30-60s)...`);
  if (!(await waitReady())) { console.error("Server did not become ready in time."); killTree(); process.exit(1); }
  await sleep(2000);

  console.log(`\n→ POST /api/v1/otp/send  { to: "${to}" }`);
  const send = await post("/api/v1/otp/send", { to });
  console.log(`  status ${send.status}:`, send.json);

  if (send.status === 202 && send.json.dev_code) {
    console.log(`\n→ POST /api/v1/otp/verify  { request_id, code: ${send.json.dev_code} }`);
    const verify = await post("/api/v1/otp/verify", { request_id: send.json.request_id, code: send.json.dev_code });
    console.log(`  status ${verify.status}:`, verify.json);
    console.log(verify.json.verified ? "\n✅ SUCCESS — full send → verify flow works!\n" : "\n❌ Verify failed.\n");
  } else {
    console.log("\n❌ Send did not succeed — see status/error above.\n");
  }
} finally {
  killTree();
  await sleep(1000);
  process.exit(0);
}
