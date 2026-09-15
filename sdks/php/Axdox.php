<?php
// AXDOX Verify — official PHP SDK.  composer require axdox/verify
namespace Axdox;

class AxdoxException extends \Exception {
    public string $code_;
    public function __construct(string $code, string $message, int $status) {
        parent::__construct($message, $status);
        $this->code_ = $code;
    }
}

class Axdox {
    private string $apiKey;
    private string $baseUrl;

    public function __construct(string $apiKey, string $baseUrl = "https://api.axdox.in") {
        if (!$apiKey) throw new \InvalidArgumentException("apiKey is required");
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, "/");
    }

    private function request(string $method, string $path, ?array $body = null): array {
        $ch = curl_init($this->baseUrl . $path);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer {$this->apiKey}",
                "Content-Type: application/json",
            ],
        ]);
        if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        $res = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $json = json_decode($res, true) ?? [];
        if ($status >= 400) {
            $err = $json["error"] ?? [];
            throw new AxdoxException($err["code"] ?? "error", $err["message"] ?? "Request failed", $status);
        }
        return $json;
    }

    public function send(string $to, ?string $emailFallback = null, ?string $channel = null, ?array $metadata = null): array {
        return $this->request("POST", "/api/v1/otp/send", [
            "to" => $to, "email_fallback" => $emailFallback,
            "channel" => $channel, "metadata" => $metadata,
        ]);
    }

    public function verify(string $requestId, string $code): array {
        return $this->request("POST", "/api/v1/otp/verify", ["request_id" => $requestId, "code" => $code]);
    }

    public function status(string $requestId): array {
        return $this->request("GET", "/api/v1/otp/status?request_id=" . urlencode($requestId));
    }
}
