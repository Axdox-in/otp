/**
 * End-to-end smoke test: send an OTP, then verify it automatically using the
 * dev_code returned when AXDOX_DEV_ECHO=true. Proves the whole pipeline works.
 *
 * Usage:
 *   node scripts/test-otp.mjs axk_test_xxx
 *   node scripts/test-otp.mjs axk_test_xxx test@example.com http://localhost:3003
 */
const key = process.argv[2];
const to = process.argv[3] || "test@example.com";
const base = (process.argv[4] || "http://localhost:3003").replace(/\/$/, "");

if (!key) {
  console.error("Usage: node scripts/test-otp.mjs <api_key> [recipient] [baseUrl]");
  process.exit(1);
}

const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

console.log(`\n→ Sending OTP to ${to} via ${base} ...`);
const sendRes = await fetch(`${base}/api/v1/otp/send`, {
  method: "POST",
  headers,
  body: JSON.stringify({ to }),
});
const send = await sendRes.json();
console.log("  send response:", send);

if (!sendRes.ok) {
  console.error("\n❌ send failed. Check the error code above.");
  process.exit(1);
}

const code = send.dev_code;
if (!code) {
  console.error("\n⚠️  No dev_code returned. Set AXDOX_DEV_ECHO=true in .env.local and restart the dev server,");
  console.error("    or read the code from the channel and verify manually.");
  process.exit(1);
}

console.log(`\n→ Verifying request ${send.request_id} with code ${code} ...`);
const verRes = await fetch(`${base}/api/v1/otp/verify`, {
  method: "POST",
  headers,
  body: JSON.stringify({ request_id: send.request_id, code }),
});
const verify = await verRes.json();
console.log("  verify response:", verify);

console.log(verify.verified ? "\n✅ SUCCESS — full send → verify flow works!\n" : "\n❌ Verification failed.\n");
