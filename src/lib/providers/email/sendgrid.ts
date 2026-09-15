import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";
import { renderOtpEmail } from "./index";

export const sendgridProvider: SendProvider = {
  name: "sendgrid",
  channel: "email",
  isAvailable() {
    return Boolean(process.env.SENDGRID_API_KEY);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const mail = renderOtpEmail(input.code, input.ttlSeconds);
      // EMAIL_FROM may be "Name <addr>"; extract the address for SendGrid.
      const from = env.EMAIL_FROM.match(/<(.+)>/)?.[1] ?? env.EMAIL_FROM;
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.SENDGRID_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: input.to }] }],
          from: { email: from },
          subject: mail.subject,
          content: [
            { type: "text/plain", value: mail.text },
            { type: "text/html", value: mail.html },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        const e = new Error(`SendGrid send failed: ${body.slice(0, 120)}`) as Error & { code?: string };
        e.code = String(res.status);
        throw e;
      }
      return { providerMessageId: res.headers.get("x-message-id") ?? undefined, costMicros: 300 };
    });
  },
};
