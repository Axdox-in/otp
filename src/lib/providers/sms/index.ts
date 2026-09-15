import "server-only";
import { type SendProvider } from "../types";
import { twilioProvider } from "./twilio";
import { msg91Provider } from "./msg91";
import { vonageProvider } from "./vonage";
import { telnyxProvider } from "./telnyx";
import { exotelProvider } from "./exotel";
import { gupshupProvider } from "./gupshup";

/**
 * SMS provider registry, in priority order. The orchestrator picks the first
 * AVAILABLE provider that supports the recipient's country. Reorder to change
 * routing preference (e.g. MSG91 first for India).
 */
const ALL: SendProvider[] = [
  telnyxProvider,
  twilioProvider,
  msg91Provider,
  vonageProvider,
  exotelProvider,
  gupshupProvider,
];

/** Country-preference overrides: put the best regional carrier first. */
const COUNTRY_PREFERENCE: Record<string, string[]> = {
  IN: ["msg91_sms", "gupshup", "exotel"],
};

export function selectSmsProvider(country?: string): SendProvider | null {
  const preferredNames = (country && COUNTRY_PREFERENCE[country]) || [];
  const preferred = preferredNames
    .map((n) => ALL.find((p) => p.name === n))
    .filter((p): p is SendProvider => Boolean(p) && p!.isAvailable(country));

  const rest = ALL.filter((p) => !preferredNames.includes(p.name) && p.isAvailable(country));
  return [...preferred, ...rest][0] ?? null;
}
