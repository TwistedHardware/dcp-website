<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import SaudiRiyal from "../../SaudiRiyal.svelte";
  import { createFetcher } from "./lib/createFetcher.svelte";
  import { formatCurrencyFromBase, formatNumber } from "./lib/format";
  import { timeFilter } from "./lib/filter.svelte";
  import type { CostItem } from "./types";

  let { lang = "en" }: { lang?: string } = $props();

  const fetcher = createFetcher<CostItem[]>({
    path: "/api/cost/daily",
    dateScoped: true,
    lang,
    select: (json) => (json.costs ?? []) as CostItem[],
  });

  const PALETTE: { bg: string; text: string; source: string }[] = [
    { bg: "bg-emerald-600", text: "text-emerald-600", source: "api" },
    { bg: "bg-violet-600", text: "text-violet-600", source: "maas" },
    { bg: "bg-amber-600", text: "text-amber-600", source: "storage" },
    { bg: "bg-rose-600", text: "text-rose-600", source: "other" },
  ];

  let sources = $derived.by(() => {
    const seen = new Set<string>();
    for (const r of fetcher.data ?? []) seen.add(r.source);
    // stable order: whatever's in PALETTE first, then any extras
    const known = PALETTE.map((p) => p.source).filter((s) => seen.has(s));
    const extras = Array.from(seen).filter(
      (s) => !PALETTE.some((p) => p.source === s)
    );
    return [...known, ...extras];
  });

  function colorFor(source: string): { bg: string; text: string } {
    const found = PALETTE.find((p) => p.source === source);
    if (found) return { bg: found.bg, text: found.text };
    return { bg: "bg-zinc-600", text: "text-zinc-500" };
  }

  let perDaySource = $derived.by(() => {
    const map = new Map<string, Map<string, number>>();
    for (const r of fetcher.data ?? []) {
      if (!map.has(r.date)) map.set(r.date, new Map());
      const day = map.get(r.date)!;
      day.set(r.source, (day.get(r.source) ?? 0) + r.cost);
    }
    return map;
  });

  let chartData = $derived.by(() => {
    const result: {
      date: string;
      bySource: Record<string, number>;
      totalBase: number;
    }[] = [];
    const today = new Date();
    for (let i = timeFilter.value - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayMap = perDaySource.get(dateStr) ?? new Map();
      const bySource: Record<string, number> = {};
      let total = 0;
      for (const [src, cost] of dayMap) {
        bySource[src] = cost;
        total += cost;
      }
      result.push({ date: dateStr, bySource, totalBase: total });
    }
    return result;
  });

  let totalBase = $derived(chartData.reduce((sum, d) => sum + d.totalBase, 0));
  let maxStack = $derived(Math.max(...chartData.map((d) => d.totalBase), 0));
</script>

<div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-6">
  <h3 class="text-base font-semibold text-zinc-200">Cost Over Time</h3>

  {#if fetcher.isLoading}
    <div class="py-20 flex flex-col items-center justify-center text-zinc-500">
      <Loader2 class="w-6 h-6 animate-spin mb-3" />
      <p class="text-sm">Loading cost data...</p>
    </div>
  {:else if fetcher.error}
    <div class="py-10 text-center text-rose-400 text-sm bg-rose-500/10 rounded-xl border border-rose-500/20">
      <p>Failed to load cost data: {fetcher.error}</p>
      <button
        onclick={() => fetcher.retry()}
        class="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
      >
        Retry
      </button>
    </div>
  {:else}
    <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4 max-w-xs">
      <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total Cost (period)</p>
      <div class="flex items-baseline gap-1">
        <span class="text-2xl font-bold text-zinc-200">
          {formatCurrencyFromBase(totalBase, lang)}
        </span>
        <SaudiRiyal class="text-2xl text-zinc-200" />
      </div>
    </div>

    <div class="pt-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-zinc-300">Daily Cost by Service</h4>
        <div class="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider font-medium text-zinc-400">
          {#each sources as src}
            {@const c = colorFor(src)}
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm {c.bg}"></span>
              {src}
            </span>
          {/each}
        </div>
      </div>

      <div class="h-48 flex items-end {timeFilter.value === 365 ? 'gap-[1px]' : 'gap-1'} w-full border-b border-zinc-800 pb-1">
        {#each chartData as day}
          {@const heightPercent = maxStack > 0 ? (day.totalBase / maxStack) * 100 : 0}
          <div
            class="relative flex-1 flex flex-col justify-end group/bar hover:opacity-100 transition-opacity"
            style="height: 100%; {maxStack > 0 ? 'opacity: 0.8;' : ''}"
          >
            <div class="w-full flex flex-col overflow-hidden rounded-t-[1px]" style="height: {heightPercent}%;">
              {#each sources as src}
                {@const cost = day.bySource[src] ?? 0}
                {#if cost > 0}
                  <div
                    class="{colorFor(src).bg} w-full transition-all"
                    style="height: {(cost / (day.totalBase || 1)) * 100}%"
                  ></div>
                {/if}
              {/each}
            </div>

            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-zinc-700">
              <p class="font-bold text-white mb-1 border-b border-zinc-700 pb-1">{day.date}</p>
              <div class="flex flex-col gap-0.5">
                {#each sources as src}
                  {@const cost = day.bySource[src] ?? 0}
                  {#if cost > 0}
                    <span class="{colorFor(src).text}">
                      {src}: {formatCurrencyFromBase(cost, lang)}
                    </span>
                  {/if}
                {/each}
                {#if day.totalBase === 0}
                  <span class="text-zinc-500">No cost</span>
                {/if}
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