import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

/** Exotel (India/SEA). SMS send via the Exotel bulk SMS API. */
export const exotelProvider: SendProvider = {
  name: "exotel",
  channel: "sms",
  isAvailable() {
    const e = process.env;
    return Boolean(e.EXOTEL_SID && e.EXOTEL_API_KEY && e.EXOTEL_API_TOKEN && e.EXOTEL_SENDER_ID);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const auth = Buffer.from(`${env.EXOTEL_API_KEY}:${env.EXOTEL_API_TOKEN}`).toString("base64");
      const form = new URLSearchParams({
        From: env.EXOTEL_SENDER_ID!,
        To: input.to,
        Body: `Your verification code is ${input.code}. Expires in ${Math.round(input.ttlSeconds / 60)} min.`,
        DltEntityId: process.env.EXOTEL_DLT_ENTITY_ID ?? "",
      });
      const res = await fetch(
        `https://api.exotel.com/v1/Accounts/${env.EXOTEL_SID}/Sms/send.json`,
        { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form },
      );
      const json = await res.json();
      if (!res.ok) {
        const e = new Error("Exotel send failed") as Error & { code?: string };
        e.code = String(res.status);
        throw e;
      }
      return { providerMessageId: json?.SMSMessage?.Sid, costMicros: 2200 };
    });
  },
};
