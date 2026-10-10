// src/components/workspace/settings/account/lib/filter.svelte.ts

import type { TimeFilter } from "../types";

/**
 * Global time filter shared by all account sections that are date-scoped.
 * Wrapped in an object because Svelte 5 runes cannot export a reassignable
 * primitive directly.
 *
 * BalanceSection intentionally ignores this.
 */
export const timeFilter = $state<{ value: TimeFilter }>({ value: 30 });

export function setTimeFilter(value: TimeFilter): void {
  timeFilter.value = value;
}