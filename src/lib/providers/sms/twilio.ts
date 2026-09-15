import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

export const twilioProvider: SendProvider = {
  name: "twilio",
  channel: "sms",
  isAvailable() {
    const e = process.env;
    return Boolean(e.TWILIO_ACCOUNT_SID && e.TWILIO_AUTH_TOKEN && e.TWILIO_FROM);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const auth = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString("base64");
      const form = new URLSearchParams({
        To: input.to,
        From: env.TWILIO_FROM!,
        Body: `Your verification code is ${input.code}. It expires in ${Math.round(input.ttlSeconds / 60)} min.`,
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
        { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form },
      );
      const json = await res.json();
      if (!res.ok) {
        const e = new Error(json?.message ?? "Twilio send failed") as Error & { code?: string };
        e.code = String(json?.code ?? res.status);
        throw e;
      }
      return { providerMessageId: json.sid, costMicros: 8300 };
    });
  },
};
