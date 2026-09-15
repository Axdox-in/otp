import "server-only";
import type { Channel, SendProvider } from "./types";

/**
 * Local development echo provider.
 * When AXDOX_DEV_ECHO=true and NODE_ENV!=production, this stands in for any
 * channel with no real provider configured: it "delivers" instantly and prints
 * the OTP to the server console so you can test send → verify with no Twilio/
 * Meta/Resend account. NEVER enabled in production.
 */
export function devEchoEnabled(): boolean {
  return process.env.AXDOX_DEV_ECHO === "true" && process.env.NODE_ENV !== "production";
}

export function devProvider(channel: Channel): SendProvider {
  return {
    name: "dev_console",
    channel,
    isAvailable: () => devEchoEnabled(),
    async send(input) {
      // eslint-disable-next-line no-console
      console.log(
        `\n🔐 [AXDOX DEV] ${channel.toUpperCase()} OTP → ${input.to}: ${input.code}  (expires in ${input.ttlSeconds}s)\n`,
      );
      return {
        success: true,
        provider: "dev_console",
        providerMessageId: `dev_${Date.now()}`,
        costMicros: 0,
        latencyMs: 0,
      };
    },
  };
}
