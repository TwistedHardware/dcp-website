<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import SaudiRiyal from "../../SaudiRiyal.svelte";
  import { createFetcher } from "./lib/createFetcher.svelte";
  import { formatNumber, formatCurrencyFromBase } from "./lib/format";
  import { timeFilter } from "./lib/filter.svelte";
  import type { ApiUsageItem } from "./types";

  let { lang = "en" }: { lang?: string } = $props();

  const RATE_PER_MILLION = 7.5; // SAR per 1,000,000 weighted tokens

  const fetcher = createFetcher<ApiUsageItem[]>({
    path: "/api/usage",
    dateScoped: true,
    lang,
    select: (json) =>
      ((json.usage ?? []) as ApiUsageItem[]).filter((r) => r.source === "api"),
  });

  // --- Aggregation ---

  let dailyAggregates = $derived.by(() => {
    const map = new Map<
      string,
      { input: number; output: number; cache: number; totalW: number }
    >();
    for (const d of fetcher.data ?? []) {
      if (!map.has(d.date)) {
        map.set(d.date, { input: 0, output: 0, cache: 0, totalW: 0 });
      }
      const curr = map.get(d.date)!;
      curr.input += d.inputTokens;
      curr.output += d.outputTokens;
      curr.cache += d.cacheHitTokens;
      curr.totalW += d.totalWeightedTokens;
    }
    return map;
  });

  let chartData = $derived.by(() => {
    const result: {
      date: string;
      input: number;
      output: number;
      cache: number;
      totalW: number;
      rawTotal: number;
    }[] = [];
    const today = new Date();

    for (let i = timeFilter.value - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const agg =
        dailyAggregates.get(dateStr) || { input: 0, output: 0, cache: 0, totalW: 0 };
      result.push({
        date: dateStr,
        ...agg,
        rawTotal: agg.input + agg.output + agg.cache,
      });
    }
    return result;
  });

  let totalWeightedTokens = $derived(
    chartData.reduce((sum, day) => sum + day.totalW, 0)
  );

  // Cost is computed in SAR here (not base units) because the rate is SAR-based.
  let totalCostSar = $derived(
		chartData.reduce((sum, day) => {
			const daySar = (day.totalW * RATE_PER_MILLION) / 1_000_000;
			// Round each day to halalas (2dp) the same way the backend does.
			return sum + Math.floor(daySar * 100) / 100;
		}, 0)
	);

  let maxStack = $derived(Math.max(...chartData.map((d) => d.rawTotal), 0));
</script>

<div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-6">
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <h3 class="text-base font-semibold text-zinc-200">API Usage Metrics</h3>
  </div>

  {#if fetcher.isLoading}
    <div class="py-20 flex flex-col items-center justify-center text-zinc-500">
      <Loader2 class="w-6 h-6 animate-spin mb-3" />
      <p class="text-sm">Loading usage data...</p>
    </div>
  {:else if fetcher.error}
    <div class="py-10 text-center text-rose-400 text-sm bg-rose-500/10 rounded-xl border border-rose-500/20">
      <p>Failed to load usage data: {fetcher.error}</p>
      <button
        onclick={() => fetcher.retry()}
        class="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
      >
        Retry
      </button>
    </div>
  {:else}
    <!-- Stats -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total API Tokens</p>
        <p class="text-2xl font-bold text-zinc-200">{formatNumber(totalWeightedTokens, lang)}</p>
      </div>
      <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">API Cost</p>
        <div class="flex items-baseline gap-1">
          <span class="text-2xl font-bold text-emerald-400">
            {formatCurrencyFromBase(Math.round(totalCostSar * 100), lang)}
          </span>
          <SaudiRiyal class="text-emerald-400 text-2xl" />
        </div>
      </div>
    </div>

    <!-- Chart -->
    <div class="pt-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-zinc-300">Daily Token Volume (Raw)</h4>
        <div class="flex items-center gap-4 text-[10px] uppercase tracking-wider font-medium text-zinc-400">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-600"></span> Input</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Output</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Cache Hit</span>
        </div>
      </div>

      <div class="h-48 flex items-end {timeFilter.value === 365 ? 'gap-[1px]' : 'gap-1'} w-full border-b border-zinc-800 pb-1 group/chart">
        {#each chartData as day}
          {@const heightPercent = maxStack > 0 ? (day.rawTotal / maxStack) * 100 : 0}
          <div
            class="relative flex-1 flex flex-col justify-end group/bar hover:opacity-100 transition-opacity"
            style="height: 100%; {maxStack > 0 ? 'opacity: 0.8;' : ''}"
          >
            <div class="w-full flex flex-col overflow-hidden rounded-t-[1px]" style="height: {heightPercent}%;">
              <div class="bg-amber-400 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.cache / day.rawTotal) * 100 : 0}%"></div>
              <div class="bg-amber-500 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.output / day.rawTotal) * 100 : 0}%"></div>
              <div class="bg-amber-600 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.input / day.rawTotal) * 100 : 0}%"></div>
            </div>

            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-zinc-700">
              <p class="font-bold text-white mb-1 border-b border-zinc-700 pb-1">{day.date}</p>
              <div class="flex flex-col gap-0.5">
                <span class="text-amber-600">Input: {formatNumber(day.input, lang)}</span>
                <span class="text-amber-500">Output: {formatNumber(day.output, lang)}</span>
                <span class="text-amber-400">Cache: {formatNumber(day.cache, lang)}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="flex justify-between items-center mt-2 text-[10px] text-zinc-500 font-mono">
        <span>{chartData[0]?.date || ''}</span>
        <span>Today</span>
      </div>
    </div>
  {/if}
</div>