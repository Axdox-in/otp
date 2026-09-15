import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMicros(micros: number, currency = "USD") {
  const value = micros / 1_000_000;
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}
