/**
 * Indian Rupee formatting.
 *
 * Always format through Intl.NumberFormat so the symbol comes from ICU
 * (U+20B9) instead of a hand-written character that can get mangled
 * by encoding conversions.
 */

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_DECIMALS = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** The rupee sign as produced by ICU, e.g. "\u20B9". */
export const CURRENCY_SYMBOL =
  INR.formatToParts(0).find((part) => part.type === "currency")?.value ?? "\u20B9";

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    // tolerate legacy strings such as "\u20B9922", "Rs. 1,25,000" or "Rs.922"
    const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Format an amount as Indian Rupees with Indian digit grouping.
 *
 *   formatINR(922)     -> "\u20B9922"
 *   formatINR(125000)  -> "\u20B91,25,000"
 *   formatINR(0)       -> "\u20B90"
 */
export function formatINR(value, { decimals = 0 } = {}) {
  const amount = toNumber(value) ?? 0;
  const formatter = decimals > 0 ? INR_DECIMALS : INR;
  return formatter.format(amount);
}

/**
 * Compact Indian notation for dashboard headline figures.
 *
 *   formatINRCompact(3500)       -> "\u20B93.5K"
 *   formatINRCompact(125000)     -> "\u20B91.25L"
 *   formatINRCompact(500000000)  -> "\u20B950Cr"
 */
export function formatINRCompact(value) {
  const amount = toNumber(value) ?? 0;
  const abs = Math.abs(amount);

  if (abs < 1000) return formatINR(amount);

  const [unitValue, suffix] =
    abs >= 10000000
      ? [amount / 10000000, "Cr"]
      : abs >= 100000
        ? [amount / 100000, "L"]
        : [amount / 1000, "K"];

  const unitAbs = Math.abs(unitValue);
  const digits = unitAbs >= 100 ? 0 : unitAbs >= 10 ? 1 : 2;
  const trimmed = unitValue
    .toFixed(digits)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");

  return `${CURRENCY_SYMBOL}${trimmed}${suffix}`;
}

/** Plain number with Indian grouping, no currency symbol. */
export function formatIndianNumber(value, { decimals = 0 } = {}) {
  const amount = toNumber(value) ?? 0;
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}
