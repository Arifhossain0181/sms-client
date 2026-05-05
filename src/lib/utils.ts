import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(value?: string | number | Date) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export function formatTaka(amount?: number | null) {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return `৳${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
