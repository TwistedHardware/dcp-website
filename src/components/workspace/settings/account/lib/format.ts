// src/components/workspace/settings/account/lib/format.ts

/** Formats an integer with locale-aware grouping. */
export function formatNumber(num: number, lang: string): string {
  return new Intl.NumberFormat(lang).format(num);
}

/**
 * Formats a base-unit amount (halalas, 1/100 SAR) as a display string.
 * Returns the numeric part only — render <SaudiRiyal /> alongside it.
 */
export function formatCurrencyFromBase(baseUnits: number, lang: string): string {
  const value = baseUnits / 100;
  return new Intl.NumberFormat(lang, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Formats a YYYY-MM-DD string for tooltips / axis labels. */
export function formatDate(isoDate: string, lang: string): string {
  const d = new Date(isoDate + "T00:00:00");
  return new Intl.DateTimeFormat(lang, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Returns YYYY-MM-DD for `daysAgo` days before today, in local time. */
export function isoDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}