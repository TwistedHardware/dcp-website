<script lang="ts">
  import { Loader2 } from "lucide-svelte";
  import { createFetcher } from "./lib/createFetcher.svelte";
  import { formatNumber } from "./lib/format";
  import { timeFilter } from "./lib/filter.svelte";
  import type { MaasUsageItem } from "./types";

  let { lang = "en" }: { lang?: string } = $props();

  const fetcher = createFetcher<MaasUsageItem[]>({
    path: "/api/maas/usage",
    dateScoped: true,
    lang,
    select: (json) => (json.usage ?? []) as MaasUsageItem[],
  });

  // Palette for instance stacks; cycles if there are more instances than colors.
  const PALETTE = [
    "bg-sky-600",
    "bg-sky-500",
    "bg-sky-400",
    "bg-indigo-600",
    "bg-indigo-500",
    "bg-indigo-400",
    "bg-teal-600",
    "bg-teal-500",
  ];

  // --- Aggregation ---

  // Distinct instances across the fetched window, stable order.
  let instances = $derived.by(() => {
    const seen = new Map<string, string>(); // id -> name
    for (const r of fetcher.data ?? []) {
      if (!seen.has(r.instanceId)) seen.set(r.instanceId, r.instanceName);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  });

  // Per-day, per-instance vramGBHours
  let perDayInstance = $derived.by(() => {
    const map = new Map<string, Map<string, number>>(); // date -> instanceId -> GB·h
    for (const r of fetcher.data ?? []) {
      if (!map.has(r.date)) map.set(r.date, new Map());
      const day = map.get(r.date)!;
      day.set(r.instanceId, (day.get(r.instanceId) ?? 0) + r.vramGBHours);
    }
    return map;
  });

  // Contiguous date series ending today
  let chartData = $derived.by(() => {
    const result: {
      date: string;
      byInstance: Record<string, number>; // instanceId -> GB·h
      totalGbHours: number;
      totalGbPerDay: number; // totalGbHours / 24, the bar height
    }[] = [];
    const today = new Date();

    for (let i = timeFilter.value - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayMap = perDayInstance.get(dateStr) ?? new Map();
      const byInstance: Record<string, number> = {};
      let total = 0;
      for (const [id, gbHours] of dayMap) {
        byInstance[id] = gbHours;
        total += gbHours;
      }
      result.push({
        date: dateStr,
        byInstance,
        totalGbHours: total,
        totalGbPerDay: total / 24,
      });
    }
    return result;
  });

  // Totals for the header cards
  let totalGbHours = $derived(
    chartData.reduce((sum, d) => sum + d.totalGbHours, 0)
  );
  let avgConcurrentGb = $derived(
    timeFilter.value > 0 ? totalGbHours / 24 / timeFilter.value : 0
  );

  let maxStack = $derived(
    Math.max(...chartData.map((d) => d.totalGbPerDay), 0)
  );

  function colorFor(index: number): string {
    return PALETTE[index % PALETTE.length];
  }
</script>

<div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-6">
  <h3 class="text-base font-semibold text-zinc-200">MaaS Consumption</h3>

  {#if fetcher.isLoading}
    <div class="py-20 flex flex-col items-center justify-center text-zinc-500">
      <Loader2 class="w-6 h-6 animate-spin mb-3" />
      <p class="text-sm">Loading MaaS usage...</p>
    </div>
  {:else if fetcher.error}
    <div class="py-10 text-center text-rose-400 text-sm bg-rose-500/10 rounded-xl border border-rose-500/20">
      <p>Failed to load MaaS usage: {fetcher.error}</p>
      <button
        onclick={() => fetcher.retry()}
        class="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
      >
        Retry
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total vRAM GB·h</p>
        <p class="text-2xl font-bold text-zinc-200">{formatNumber(Math.round(totalGbHours), lang)}</p>
      </div>
      <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
        <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Avg Concurrent vRAM</p>
        <div class="flex items-baseline gap-1">
          <span class="text-2xl font-bold text-sky-400">{formatNumber(Math.round(avgConcurrentGb), lang)}</span>
          <span class="text-sm text-sky-400">GB</span>
        </div>
      </div>
    </div>

    <div class="pt-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-zinc-300">Daily vRAM Usage</h4>
        <div class="flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-wider font-medium text-zinc-400">
          {#each instances as inst, i}
            <span class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-sm {colorFor(i)}"></span>
              {inst.name}
            </span>
          {/each}
        </div>
      </div>

      <div class="h-48 flex items-end {timeFilter.value === 365 ? 'gap-[1px]' : 'gap-1'} w-full border-b border-zinc-800 pb-1">
        {#each chartData as day}
          {@const heightPercent = maxStack > 0 ? (day.totalGbPerDay / maxStack) * 100 : 0}
          <div
            class="relative flex-1 flex flex-col justify-end group/bar hover:opacity-100 transition-opacity"
            style="height: 100%; {maxStack > 0 ? 'opacity: 0.8;' : ''}"
          >
            <div class="w-full flex flex-col overflow-hidden rounded-t-[1px]" style="height: {heightPercent}%;">
              {#each instances as inst, i}
                {@const gbHours = day.byInstance[inst.id] ?? 0}
                {@const gbPerDay = gbHours / 24}
                {#if gbPerDay > 0}
                  <div
                    class="{colorFor(i)} w-full transition-all"
                    style="height: {(gbPerDay / (day.totalGbPerDay || 1)) * 100}%"
                  ></div>
                {/if}
              {/each}
            </div>

            <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-zinc-700">
              <p class="font-bold text-white mb-1 border-b border-zinc-700 pb-1">{day.date}</p>
              <div class="flex flex-col gap-0.5">
                {#each instances as inst, i}
                  {@const gbHours = day.byInstance[inst.id] ?? 0}
                  {#if gbHours > 0}
                    <span class="{colorFor(i).replace('bg-', 'text-')}">
                      {inst.name}: {formatNumber(Math.round(gbHours / 24), lang)} GB/day
                      ({formatNumber(Math.round(gbHours), lang)} GB·h)
                    </span>
                  {/if}
                {/each}
                {#if day.totalGbHours === 0}
                  <span class="text-zinc-500">No usage</span>
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