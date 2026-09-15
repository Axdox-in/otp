import "server-only";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";

/**
 * MSG91 (India). Uses the OTP endpoint with a DLT-approved template.
 * `to` must be digits without '+'.
 */
export const msg91Provider: SendProvider = {
  name: "msg91_sms",
  channel: "sms",
  isAvailable(country) {
    const e = process.env;
    const configured = Boolean(e.MSG91_AUTH_KEY && e.MSG91_TEMPLATE_ID);
    // MSG91 is India-optimized; still allow globally if configured.
    return configured && (country ? true : true);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const mobile = input.to.replace(/^\+/, "");
      const res = await fetch("https://control.msg91.com/api/v5/otp", {
        method: "POST",
        headers: { authkey: env.MSG91_AUTH_KEY!, "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: env.MSG91_TEMPLATE_ID,
          mobile,
          otp: input.code,
          otp_expiry: Math.round(input.ttlSeconds / 60),
          sender: env.MSG91_SENDER_ID,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.type === "error") {
        const e = new Error(json?.message ?? "MSG91 send failed") as Error & { code?: string };
        e.code = String(res.status);
        throw e;
      }
      return { providerMessageId: json?.request_id, costMicros: 2000 };
    });
  },
};
