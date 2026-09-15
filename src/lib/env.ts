import { z } from "zod";

/**
 * Centralized, validated environment access.
 * Server-only secrets must never be imported into client components.
 */
const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OTP_PEPPER: z.string().min(32, "OTP_PEPPER must be >= 32 chars"),
  API_KEY_PEPPER: z.string().min(32, "API_KEY_PEPPER must be >= 32 chars"),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_AUTH_TEMPLATE_NAME: z.string().default("axdox_auth_code"),
  WHATSAPP_AUTH_TEMPLATE_LANG: z.string().default("en_US"),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  VONAGE_API_KEY: z.string().optional(),
  VONAGE_API_SECRET: z.string().optional(),
  VONAGE_FROM: z.string().default("AXDOX"),
  TELNYX_API_KEY: z.string().optional(),
  TELNYX_MESSAGING_PROFILE_ID: z.string().optional(),
  EXOTEL_SID: z.string().optional(),
  EXOTEL_API_KEY: z.string().optional(),
  EXOTEL_API_TOKEN: z.string().optional(),
  EXOTEL_SENDER_ID: z.string().optional(),
  GUPSHUP_API_KEY: z.string().optional(),
  GUPSHUP_SOURCE: z.string().optional(),

  EMAIL_FROM: z.string().default("AXDOX Verify <verify@axdox.in>"),
  RESEND_API_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

// Public env is safe on both server and client.
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

let _serverEnv: z.infer<typeof serverSchema> | null = null;

/** Lazily parse & cache server env. Throws if required secrets are missing. */
export function serverEnv() {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called on the client");
  }
  if (!_serverEnv) _serverEnv = serverSchema.parse(process.env);
  return _serverEnv;
}
