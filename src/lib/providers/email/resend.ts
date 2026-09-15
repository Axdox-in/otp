import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";
import { renderOtpEmail } from "./index";

export const resendProvider: SendProvider = {
  name: "resend",
  channel: "email",
  isAvailable() {
    return Boolean(process.env.RESEND_API_KEY);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const mail = renderOtpEmail(input.code, input.ttlSeconds);
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: input.to, subject: mail.subject, html: mail.html, text: mail.text }),
      });
      const json = await res.json();
      if (!res.ok) {
        const e = new Error(json?.message ?? "Resend send failed") as Error & { code?: string };
        e.code = String(res.status);
        throw e;
      }
      return { providerMessageId: json?.id, costMicros: 400 };
    });
  },
};
