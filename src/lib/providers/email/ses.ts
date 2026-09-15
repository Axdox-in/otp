import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { serverEnv } from "@/lib/env";
import { type SendProvider, runSend } from "../types";
import { renderOtpEmail } from "./index";

let _client: SESv2Client | null = null;
function client() {
  const env = serverEnv();
  if (!_client) {
    _client = new SESv2Client({
      region: env.AWS_REGION,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
          : undefined, // fall back to instance/role credentials on Vercel/AWS
    });
  }
  return _client;
}

export const sesProvider: SendProvider = {
  name: "amazon_ses",
  channel: "email",
  isAvailable() {
    return Boolean(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_REGION);
  },
  send(input) {
    return runSend(this.name, async () => {
      const env = serverEnv();
      const mail = renderOtpEmail(input.code, input.ttlSeconds);
      const out = await client().send(
        new SendEmailCommand({
          FromEmailAddress: env.EMAIL_FROM,
          Destination: { ToAddresses: [input.to] },
          Content: {
            Simple: {
              Subject: { Data: mail.subject },
              Body: { Text: { Data: mail.text }, Html: { Data: mail.html } },
            },
          },
        }),
      );
      return { providerMessageId: out.MessageId, costMicros: 100 };
    });
  },
};
