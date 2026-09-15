"""AXDOX Verify — official Python SDK.  pip install axdox-verify"""
from __future__ import annotations
import json
import urllib.request
import urllib.error
from typing import Any, Optional


class AxdoxError(Exception):
    def __init__(self, code: str, message: str, status: int):
        super().__init__(f"[{code}] {message}")
        self.code, self.status = code, status


class Axdox:
    def __init__(self, api_key: str, base_url: str = "https://api.axdox.com"):
        if not api_key:
            raise ValueError("api_key is required")
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def _request(self, method: str, path: str, body: Optional[dict] = None) -> dict[str, Any]:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(
            f"{self.base_url}{path}",
            data=data,
            method=method,
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                return json.loads(resp.read() or "{}")
        except urllib.error.HTTPError as e:
            payload = json.loads(e.read() or "{}")
            err = payload.get("error", {})
            raise AxdoxError(err.get("code", "error"), err.get("message", str(e)), e.code)

    def send(self, to: str, email_fallback: str | None = None,
             channel: str | None = None, metadata: dict | None = None) -> dict:
        return self._request("POST", "/api/v1/otp/send", {
            "to": to, "email_fallback": email_fallback,
            "channel": channel, "metadata": metadata,
        })

    def verify(self, request_id: str, code: str) -> dict:
        return self._request("POST", "/api/v1/otp/verify", {"request_id": request_id, "code": code})

    def status(self, request_id: str) -> dict:
        return self._request("GET", f"/api/v1/otp/status?request_id={request_id}")
