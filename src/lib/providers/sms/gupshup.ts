import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

export const gupshupProvider: SendProvider = {
  name: "gupshup",
  channel: "sms",
  isAvailable() {
    const e = process.env;
    return Boolean(e.GUPSHUP_API_KEY && e.GUPSHUP_SOURCE);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const form = new URLSearchParams({
        method: "SendMessage",
        send_to: input.to.replace(/^\+/, ""),
        msg: `Your verification code is ${input.code}. Expires in ${Math.round(input.ttlSeconds / 60)} min.`,
        msg_type: "TEXT",
        auth_scheme: "plain",
        format: "json",
        userid: env.GUPSHUP_SOURCE!,
        password: env.GUPSHUP_API_KEY!,
        v: "1.1",
      });
      const res = await fetch(`https://enterprise.smsgupshup.com/GatewayAPI/rest?${form.toString()}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.response?.status === "error") {
        const e = new Error(json?.response?.details ?? "Gupshup send failed") as Error & { code?: string };
        e.code = String(res.status);
        throw e;
      }
      return { providerMessageId: json?.response?.id, costMicros: 1700 };
    });
  },
};
