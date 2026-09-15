// Safely set/replace KEY=VALUE lines in .env.local without duplicating keys.
// Usage: node scripts/patch-env.cjs 'KEY=value' 'OTHER=value with spaces'
const fs = require("fs");
const path = ".env.local";
let lines = fs.readFileSync(path, "utf8").split(/\r?\n/);
for (const arg of process.argv.slice(2)) {
  const i = arg.indexOf("=");
  const k = arg.slice(0, i);
  const v = arg.slice(i + 1);
  const re = new RegExp("^" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "=");
  let found = false;
  lines = lines.map((l) => (re.test(l) ? ((found = true), k + "=" + v) : l));
  if (!found) lines.push(k + "=" + v);
}
fs.writeFileSync(path, lines.join("\n"));
console.log("patched:", process.argv.slice(2).map((a) => a.split("=")[0]).join(", "));
