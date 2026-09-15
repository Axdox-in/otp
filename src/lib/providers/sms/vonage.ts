import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

export const vonageProvider: SendProvider = {
  name: "vonage",
  channel: "sms",
  isAvailable() {
    const e = process.env;
    return Boolean(e.VONAGE_API_KEY && e.VONAGE_API_SECRET);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const form = new URLSearchParams({
        api_key: env.VONAGE_API_KEY!,
        api_secret: env.VONAGE_API_SECRET!,
        to: input.to.replace(/^\+/, ""),
        from: env.VONAGE_FROM,
        text: `Your verification code is ${input.code}. Expires in ${Math.round(input.ttlSeconds / 60)} min.`,
      });
      const res = await fetch("https://rest.nexmo.com/sms/json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form,
      });
      const json = await res.json();
      const msg = json?.messages?.[0];
      // Vonage returns 200 with per-message status; "0" == success.
      if (!msg || msg.status !== "0") {
        const e = new Error(msg?.["error-text"] ?? "Vonage send failed") as Error & { code?: string };
        e.code = String(msg?.status ?? res.status);
        throw e;
      }
      return { providerMessageId: msg["message-id"], costMicros: 7000 };
    });
  },
};
