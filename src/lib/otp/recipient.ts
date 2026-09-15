import { ApiError } from "@/lib/errors";

export type Recipient =
  | { kind: "phone"; e164: string; country: string; masked: string }
  | { kind: "email"; address: string; masked: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize & validate a recipient. Phones must be E.164 (+<country><number>).
 * Country is inferred from a small dialing-code prefix map; extend as needed.
 * For production-grade phone parsing, swap in libphonenumber.
 */
export function parseRecipient(raw: string): Recipient {
  const value = raw.trim();

  if (value.includes("@")) {
    if (!EMAIL_RE.test(value)) throw new ApiError("invalid_recipient", "Invalid email address.");
    const [local, domain] = value.toLowerCase().split("@");
    const masked = `${local[0] ?? "*"}***@${domain}`;
    return { kind: "email", address: value.toLowerCase(), masked };
  }

  const digits = value.replace(/[^\d+]/g, "");
  if (!/^\+\d{7,15}$/.test(digits)) {
    throw new ApiError("invalid_recipient", "Phone must be E.164 format, e.g. +14155552671.");
  }
  const country = inferCountry(digits);
  const masked = digits.slice(0, 3) + "*".repeat(Math.max(0, digits.length - 6)) + digits.slice(-3);
  return { kind: "phone", e164: digits, country, masked };
}

// Minimal dialing-code → ISO map. Ordered longest-prefix-first at lookup.
const DIALING: Array<[string, string]> = [
  ["+1", "US"], ["+44", "GB"], ["+91", "IN"], ["+61", "AU"], ["+49", "DE"],
  ["+33", "FR"], ["+971", "AE"], ["+65", "SG"], ["+55", "BR"], ["+27", "ZA"],
  ["+234", "NG"], ["+62", "ID"], ["+63", "PH"], ["+92", "PK"], ["+880", "BD"],
];

function inferCountry(e164: string): string {
  const sorted = [...DIALING].sort((a, b) => b[0].length - a[0].length);
  for (const [code, iso] of sorted) if (e164.startsWith(code)) return iso;
  return "XX";
}
