import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, type SendInput, runSend } from "./types";

const GRAPH = "https://graph.facebook.com/v21.0";

/**
 * Meta WhatsApp Cloud API — authentication template sender.
 * The template must be an APPROVED `AUTHENTICATION` template with a
 * copy-code button; the code is passed as body + button parameter.
 */
export const whatsappProvider: SendProvider = {
  name: "whatsapp_cloud",
  channel: "whatsapp",

  isAvailable() {
    const e = process.env;
    return Boolean(e.WHATSAPP_PHONE_NUMBER_ID && e.WHATSAPP_ACCESS_TOKEN);
  },

  send(input: SendInput) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const to = input.to.replace(/^\+/, ""); // Cloud API wants no leading +
      const body = {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: env.WHATSAPP_AUTH_TEMPLATE_NAME,
          language: { code: env.WHATSAPP_AUTH_TEMPLATE_LANG },
          components: [
            { type: "body", parameters: [{ type: "text", text: input.code }] },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: input.code }],
            },
          ],
        },
      };

      const res = await fetch(`${GRAPH}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        const err = json?.error;
        const e = new Error(err?.message ?? "WhatsApp send failed") as Error & { code?: string };
        e.code = String(err?.code ?? res.status);
        throw e;
      }
      return {
        providerMessageId: json?.messages?.[0]?.id,
        costMicros: 1400, // ~$0.0014 auth (India); replace with per-country rate card
      };
    });
  },
};
