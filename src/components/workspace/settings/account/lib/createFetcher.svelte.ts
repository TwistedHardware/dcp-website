// src/components/workspace/settings/account/lib/createFetcher.svelte.ts

import { authHeaders, handleUnauthorized, API_BASE } from "./auth";
import { timeFilter } from "./filter.svelte";

type FetcherOptions<T> = {
  /** Path relative to API_BASE, e.g. "/api/usage". */
  path: string;
  /** Extract the typed payload from the JSON response. Throw to signal an error. */
  select: (json: any) => T;
  /** When true, append ?days=<timeFilter> and refetch on filter change. */
  dateScoped?: boolean;
  /** Language code, used for the unauthorized redirect target. */
  lang: string;
};

type FetcherState<T> = {
  readonly data: T | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  retry: () => void;
};

/**
 * Runes-based fetcher used by all account sections.
 *
 * - Runs once on mount.
 * - If `dateScoped`, re-runs whenever the global timeFilter changes.
 * - Exposes `retry()` so a section can recover from an error without a page reload.
 */
export function createFetcher<T>(opts: FetcherOptions<T>): FetcherState<T> {
  let data = $state<T | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let reloadToken = $state(0);

  async function run(): Promise<void> {
    isLoading = true;
    error = null;
    try {
      const url = opts.dateScoped
        ? `${API_BASE}${opts.path}?days=${timeFilter.value}`
        : `${API_BASE}${opts.path}`;

      const res = await fetch(url, { method: "GET", headers: authHeaders() });

      if (res.status === 401) {
        handleUnauthorized(opts.lang);
        throw new Error("Unauthorized");
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.status !== "ok") throw new Error(json.error || "Request failed");

      data = opts.select(json);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      data = null;
    } finally {
      isLoading = false;
    }
  }

  $effect(() => {
    // Track filter changes (only meaningful when dateScoped).
    if (opts.dateScoped) void timeFilter.value;
    // Track manual retries.
    void reloadToken;
    void run();
  });

  return {
    get data() {
      return data;
    },
    get isLoading() {
      return isLoading;
    },
    get error() {
      return error;
    },
    retry() {
      reloadToken++;
    },
  };
}