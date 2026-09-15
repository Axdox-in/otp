import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

export const telnyxProvider: SendProvider = {
  name: "telnyx",
  channel: "sms",
  isAvailable() {
    const e = process.env;
    return Boolean(e.TELNYX_API_KEY && e.TELNYX_MESSAGING_PROFILE_ID);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const res = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.TELNYX_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_profile_id: env.TELNYX_MESSAGING_PROFILE_ID,
          to: input.to,
          text: `Your verification code is ${input.code}. Expires in ${Math.round(input.ttlSeconds / 60)} min.`,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const e = new Error(json?.errors?.[0]?.detail ?? "Telnyx send failed") as Error & { code?: string };
        e.code = String(json?.errors?.[0]?.code ?? res.status);
        throw e;
      }
      return { providerMessageId: json?.data?.id, costMicros: 4000 };
    });
  },
};
