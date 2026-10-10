// src/components/workspace/settings/account/types.ts

/**
 * Shared types for the account settings sections.
 *
 * Money fields are always integers in the base unit (halalas, 1/100 SAR).
 * Convert to display units only at the render boundary via
 * `formatCurrencyFromBase` in ./lib/format.ts.
 *
 * Usage counts (tokens, GB, hours) are raw values, not base units.
 */

/** A single API-usage metering row. The FE only consumes rows with source === "api". */
export type ApiUsageItem = {
  _id: string;
  subject: string;
  source: string;
  date: string; // YYYY-MM-DD
  inputTokens: number;
  outputTokens: number;
  cacheHitTokens: number;
  totalWeightedTokens: number;
  posted: boolean; // financial flag, not used by the FE
};

/** A single MaaS-usage daily row, already aggregated per (date, instanceId) by the API. */
export type MaasUsageItem = {
  date: string; // YYYY-MM-DD
  instanceId: string;
  instanceName: string; // display name; falls back to model name on the backend
  modelName: string;
  modelSizeGB: number;
  activeHours: number; // capped at 24 by the backend
  vramGBHours: number; // modelSizeGB * activeHours
};

/** A single daily cost row per service source. */
export type CostItem = {
  date: string; // YYYY-MM-DD
  source: string; // "api" | "maas" | ...
  cost: number; // base units (halalas)
};

/** Snapshot of the user's balance. */
export type Balance = {
  balance: number; // base units
  totalSpent: number; // base units
  totalAdded: number; // base units
};

/** Global time filter options, in days. */
export type TimeFilter = 30 | 90 | 365;