# AXDOX Verify — Quick Start

Verify a user in two API calls, with automatic WhatsApp → SMS → Email fallback.

## 1. Get an API key
Dashboard → **API Keys** → *Create key*. Copy the `axk_live_…` secret (shown once).

## 2. Send a code
```bash
curl -X POST https://api.axdox.com/api/v1/otp/send \
  -H "Authorization: Bearer axk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "to": "+14155552671", "email_fallback": "user@acme.com" }'
```
```json
{ "request_id": "8f3c…", "status": "pending", "channel": "whatsapp",
  "to": "+14*****2671", "expires_at": "2026-09-15T10:05:00Z" }
```

## 3. Verify the code
```bash
curl -X POST https://api.axdox.com/api/v1/otp/verify \
  -H "Authorization: Bearer axk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "request_id": "8f3c…", "code": "482915" }'
```
```json
{ "status": "approved", "verified": true }
```

## SDKs
```ts
import Axdox from "@axdox/verify";
const axdox = new Axdox({ apiKey: process.env.AXDOX_KEY! });
const { request_id } = await axdox.send({ to: "+14155552671", emailFallback: "u@acme.com" });
const { verified } = await axdox.verify(request_id, userEnteredCode);
```
```python
from axdox_verify import Axdox
axdox = Axdox(api_key=os.environ["AXDOX_KEY"])
r = axdox.send(to="+14155552671", email_fallback="u@acme.com")
ok = axdox.verify(r["request_id"], user_code)["verified"]
```

## Endpoints
| Method | Path | Scope | Purpose |
|---|---|---|---|
| POST | `/api/v1/otp/send` | `otp:send` | Start a verification |
| POST | `/api/v1/otp/verify` | `otp:verify` | Check a code |
| GET | `/api/v1/otp/status` | `otp:read` | Poll status |

## Error codes
`unauthorized`, `forbidden`, `invalid_recipient`, `country_not_allowed`,
`rate_limited`, `insufficient_balance`, `expired`, `max_attempts_exceeded`,
`all_channels_failed`, `internal_error`. Every response includes a `request_id`.
