// Multi-language code samples for the docs. Base URL is a placeholder —
// replace `API` with your real deployment URL.
export const API = "https://api.axdox.in";

type Tab = { label: string; code: string };

export const sendTabs: Tab[] = [
  {
    label: "cURL",
    code: `curl -X POST ${API}/api/v1/otp/send \\
  -H "Authorization: Bearer axk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "to": "+14155552671" }'`,
  },
  {
    label: "Next.js",
    code: `// app/api/send-code/route.ts  (Route Handler)
export async function POST(req: Request) {
  const { phone } = await req.json();

  const r = await fetch("${API}/api/v1/otp/send", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.AXDOX_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ to: phone }),
  });

  const { request_id } = await r.json();
  return Response.json({ request_id });
}`,
  },
  {
    label: "Node.js",
    code: `const res = await fetch("${API}/api/v1/otp/send", {
  method: "POST",
  headers: {
    Authorization: "Bearer axk_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ to: "+14155552671" }),
});
const { request_id } = await res.json();`,
  },
  {
    label: "Python",
    code: `import requests

r = requests.post(
    "${API}/api/v1/otp/send",
    headers={"Authorization": "Bearer axk_live_YOUR_KEY"},
    json={"to": "+14155552671"},
)
request_id = r.json()["request_id"]`,
  },
  {
    label: "PHP",
    code: `$ch = curl_init("${API}/api/v1/otp/send");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer axk_live_YOUR_KEY",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode(["to" => "+14155552671"]),
]);
$data = json_decode(curl_exec($ch), true);
$requestId = $data["request_id"];`,
  },
  {
    label: "Go",
    code: `body, _ := json.Marshal(map[string]string{"to": "+14155552671"})
req, _ := http.NewRequest("POST", "${API}/api/v1/otp/send", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer axk_live_YOUR_KEY")
req.Header.Set("Content-Type", "application/json")
res, _ := http.DefaultClient.Do(req)
defer res.Body.Close()`,
  },
  {
    label: "Ruby",
    code: `require "net/http"
require "json"

uri = URI("${API}/api/v1/otp/send")
res = Net::HTTP.post(uri, { to: "+14155552671" }.to_json,
  "Authorization" => "Bearer axk_live_YOUR_KEY",
  "Content-Type" => "application/json")
request_id = JSON.parse(res.body)["request_id"]`,
  },
  {
    label: "Java",
    code: `HttpClient client = HttpClient.newHttpClient();
HttpRequest req = HttpRequest.newBuilder(URI.create("${API}/api/v1/otp/send"))
    .header("Authorization", "Bearer axk_live_YOUR_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString("{\\"to\\":\\"+14155552671\\"}"))
    .build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());`,
  },
  {
    label: "C#",
    code: `using var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer axk_live_YOUR_KEY");
var content = new StringContent(
    "{\\"to\\":\\"+14155552671\\"}", Encoding.UTF8, "application/json");
var res = await client.PostAsync("${API}/api/v1/otp/send", content);
var body = await res.Content.ReadAsStringAsync();`,
  },
];

export const verifyTabs: Tab[] = [
  {
    label: "cURL",
    code: `curl -X POST ${API}/api/v1/otp/verify \\
  -H "Authorization: Bearer axk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "request_id": "8f3c...", "code": "482913" }'`,
  },
  {
    label: "Next.js",
    code: `// app/api/verify-code/route.ts  (Route Handler)
export async function POST(req: Request) {
  const { request_id, code } = await req.json();

  const r = await fetch("${API}/api/v1/otp/verify", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.AXDOX_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ request_id, code }),
  });

  const { verified } = await r.json();
  return Response.json({ verified });
}`,
  },
  {
    label: "Node.js",
    code: `const res = await fetch("${API}/api/v1/otp/verify", {
  method: "POST",
  headers: {
    Authorization: "Bearer axk_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ request_id, code }),
});
const { verified } = await res.json();`,
  },
  {
    label: "Python",
    code: `r = requests.post(
    "${API}/api/v1/otp/verify",
    headers={"Authorization": "Bearer axk_live_YOUR_KEY"},
    json={"request_id": request_id, "code": code},
)
verified = r.json()["verified"]`,
  },
  {
    label: "PHP",
    code: `$ch = curl_init("${API}/api/v1/otp/verify");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer axk_live_YOUR_KEY",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "request_id" => $requestId,
        "code" => $code,
    ]),
]);
$verified = json_decode(curl_exec($ch), true)["verified"];`,
  },
  {
    label: "Go",
    code: `body, _ := json.Marshal(map[string]string{"request_id": requestID, "code": code})
req, _ := http.NewRequest("POST", "${API}/api/v1/otp/verify", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer axk_live_YOUR_KEY")
req.Header.Set("Content-Type", "application/json")
res, _ := http.DefaultClient.Do(req)
defer res.Body.Close()`,
  },
  {
    label: "Ruby",
    code: `uri = URI("${API}/api/v1/otp/verify")
res = Net::HTTP.post(uri, { request_id: request_id, code: code }.to_json,
  "Authorization" => "Bearer axk_live_YOUR_KEY",
  "Content-Type" => "application/json")
verified = JSON.parse(res.body)["verified"]`,
  },
  {
    label: "Java",
    code: `HttpRequest req = HttpRequest.newBuilder(URI.create("${API}/api/v1/otp/verify"))
    .header("Authorization", "Bearer axk_live_YOUR_KEY")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\\"request_id\\":\\"8f3c...\\",\\"code\\":\\"482913\\"}"))
    .build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());`,
  },
  {
    label: "C#",
    code: `var content = new StringContent(
    "{\\"request_id\\":\\"8f3c...\\",\\"code\\":\\"482913\\"}", Encoding.UTF8, "application/json");
var res = await client.PostAsync("${API}/api/v1/otp/verify", content);
var verified = await res.Content.ReadAsStringAsync();`,
  },
];

export const statusTabs: Tab[] = [
  {
    label: "cURL",
    code: `curl "${API}/api/v1/otp/status?request_id=8f3c..." \\
  -H "Authorization: Bearer axk_live_YOUR_KEY"`,
  },
  {
    label: "Next.js",
    code: `const r = await fetch(
  "${API}/api/v1/otp/status?request_id=" + id,
  { headers: { Authorization: "Bearer " + process.env.AXDOX_KEY } },
);
const status = await r.json();`,
  },
  {
    label: "Node.js",
    code: `const res = await fetch(
  "${API}/api/v1/otp/status?request_id=" + id,
  { headers: { Authorization: "Bearer axk_live_YOUR_KEY" } },
);
const status = await res.json();`,
  },
  {
    label: "Python",
    code: `r = requests.get(
    "${API}/api/v1/otp/status",
    headers={"Authorization": "Bearer axk_live_YOUR_KEY"},
    params={"request_id": request_id},
)
status = r.json()`,
  },
  {
    label: "PHP",
    code: `$ch = curl_init("${API}/api/v1/otp/status?request_id=" . $requestId);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ["Authorization: Bearer axk_live_YOUR_KEY"],
]);
$status = json_decode(curl_exec($ch), true);`,
  },
  {
    label: "Go",
    code: `req, _ := http.NewRequest("GET", "${API}/api/v1/otp/status?request_id="+requestID, nil)
req.Header.Set("Authorization", "Bearer axk_live_YOUR_KEY")
res, _ := http.DefaultClient.Do(req)
defer res.Body.Close()`,
  },
  {
    label: "Ruby",
    code: `uri = URI("${API}/api/v1/otp/status?request_id=#{request_id}")
req = Net::HTTP::Get.new(uri)
req["Authorization"] = "Bearer axk_live_YOUR_KEY"
res = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |h| h.request(req) }
status = JSON.parse(res.body)`,
  },
  {
    label: "Java",
    code: `HttpRequest req = HttpRequest.newBuilder(
    URI.create("${API}/api/v1/otp/status?request_id=8f3c..."))
    .header("Authorization", "Bearer axk_live_YOUR_KEY")
    .GET().build();
HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());`,
  },
  {
    label: "C#",
    code: `using var client = new HttpClient();
client.DefaultRequestHeaders.Add("Authorization", "Bearer axk_live_YOUR_KEY");
var res = await client.GetAsync("${API}/api/v1/otp/status?request_id=8f3c...");
var status = await res.Content.ReadAsStringAsync();`,
  },
];

// Full backend flow (two routes on the customer's own server).
export const exampleTabs: Tab[] = [
  {
    label: "Next.js",
    code: `// app/api/signup/start/route.ts
export async function POST(req: Request) {
  const { phone } = await req.json();
  const r = await fetch("${API}/api/v1/otp/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.AXDOX_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ to: phone }),
  });
  return Response.json({ request_id: (await r.json()).request_id });
}

// app/api/signup/confirm/route.ts
export async function POST(req: Request) {
  const { request_id, code } = await req.json();
  const r = await fetch("${API}/api/v1/otp/verify", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.AXDOX_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ request_id, code }),
  });
  const { verified } = await r.json();
  return Response.json({ ok: verified }, { status: verified ? 200 : 400 });
}`,
  },
  {
    label: "Node.js (Express)",
    code: `const AXDOX = "${API}";
const KEY = process.env.AXDOX_KEY;

app.post("/signup/start", async (req, res) => {
  const r = await fetch(AXDOX + "/api/v1/otp/send", {
    method: "POST",
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ to: req.body.phone }),
  });
  res.json({ request_id: (await r.json()).request_id });
});

app.post("/signup/confirm", async (req, res) => {
  const r = await fetch(AXDOX + "/api/v1/otp/verify", {
    method: "POST",
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: req.body.request_id, code: req.body.code }),
  });
  const { verified } = await r.json();
  verified ? res.json({ ok: true }) : res.status(400).json({ ok: false });
});`,
  },
  {
    label: "Python (Flask)",
    code: `import os, requests
from flask import Flask, request, jsonify

AXDOX = "${API}"
KEY = os.environ["AXDOX_KEY"]
app = Flask(__name__)

@app.post("/signup/start")
def start():
    r = requests.post(AXDOX + "/api/v1/otp/send",
        headers={"Authorization": f"Bearer {KEY}"},
        json={"to": request.json["phone"]})
    return jsonify(request_id=r.json()["request_id"])

@app.post("/signup/confirm")
def confirm():
    r = requests.post(AXDOX + "/api/v1/otp/verify",
        headers={"Authorization": f"Bearer {KEY}"},
        json={"request_id": request.json["request_id"], "code": request.json["code"]})
    ok = r.json()["verified"]
    return (jsonify(ok=True) if ok else (jsonify(ok=False), 400))`,
  },
  {
    label: "PHP",
    code: `<?php
$AXDOX = "${API}";
$KEY = getenv("AXDOX_KEY");

function axdox($path, $body) {
    global $AXDOX, $KEY;
    $ch = curl_init($AXDOX . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $KEY", "Content-Type: application/json"],
        CURLOPT_POSTFIELDS => json_encode($body),
    ]);
    return json_decode(curl_exec($ch), true);
}

// POST /signup/start
$r = axdox("/api/v1/otp/send", ["to" => $_POST["phone"]]);
echo json_encode(["request_id" => $r["request_id"]]);

// POST /signup/confirm
$r = axdox("/api/v1/otp/verify", ["request_id" => $_POST["request_id"], "code" => $_POST["code"]]);
echo json_encode(["ok" => $r["verified"]]);`,
  },
];

// Webhook signature verification (on the customer's server).
export const webhookTabs: Tab[] = [
  {
    label: "Node.js",
    code: `import crypto from "crypto";

app.post("/webhooks/axdox", express.raw({ type: "*/*" }), (req, res) => {
  const signature = req.headers["x-axdox-signature"];
  const expected = crypto
    .createHmac("sha256", process.env.AXDOX_WEBHOOK_SECRET)
    .update(req.body) // the raw request body
    .digest("hex");

  if (signature !== expected) return res.status(401).end();

  const event = JSON.parse(req.body);
  // event.type === "verification.completed" | "verification.failed"
  res.json({ received: true });
});`,
  },
  {
    label: "Python",
    code: `import hmac, hashlib, os
from flask import request, abort

@app.post("/webhooks/axdox")
def axdox_webhook():
    signature = request.headers.get("X-AXDOX-Signature", "")
    expected = hmac.new(
        os.environ["AXDOX_WEBHOOK_SECRET"].encode(),
        request.get_data(),           # the raw request body
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        abort(401)

    event = request.get_json()
    # event["type"] == "verification.completed" | "verification.failed"
    return {"received": True}`,
  },
  {
    label: "PHP",
    code: `<?php
$secret = getenv("AXDOX_WEBHOOK_SECRET");
$payload = file_get_contents("php://input");        // raw body
$signature = $_SERVER["HTTP_X_AXDOX_SIGNATURE"] ?? "";
$expected = hash_hmac("sha256", $payload, $secret);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    exit;
}

$event = json_decode($payload, true);
// $event["type"] === "verification.completed" | "verification.failed"
echo json_encode(["received" => true]);`,
  },
];

// SDK usage.
export const sdkTabs: Tab[] = [
  {
    label: "Next.js",
    code: `// app/api/send-code/route.ts
import Axdox from "@axdox/verify";
const axdox = new Axdox({ apiKey: process.env.AXDOX_KEY });

export async function POST(req: Request) {
  const { phone } = await req.json();
  const { request_id } = await axdox.send({ to: phone });
  return Response.json({ request_id });
}`,
  },
  {
    label: "Node.js",
    code: `import Axdox from "@axdox/verify";
const axdox = new Axdox({ apiKey: process.env.AXDOX_KEY });

const { request_id } = await axdox.send({ to: "+14155552671" });
const { verified } = await axdox.verify(request_id, userEnteredCode);`,
  },
  {
    label: "Python",
    code: `from axdox_verify import Axdox
axdox = Axdox(api_key=os.environ["AXDOX_KEY"])

r = axdox.send(to="+14155552671")
ok = axdox.verify(r["request_id"], user_code)["verified"]`,
  },
  {
    label: "PHP",
    code: `use Axdox\\Axdox;
$axdox = new Axdox(getenv("AXDOX_KEY"));

$r = $axdox->send("+14155552671");
$ok = $axdox->verify($r["request_id"], $userCode)["verified"];`,
  },
];
