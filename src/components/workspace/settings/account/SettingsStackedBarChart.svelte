<script lang="ts">
  type ChartSegment = {
    key: string;
    label: string;
    value: number;
    colorClass: string;  // e.g. "bg-amber-600"
    textClass: string;   // e.g. "text-amber-600"
    tooltipValue: string; // pre-formatted, e.g. "32 GB/day (768 GB·h)"
  };

  type ChartDay = {
    date: string;
    total: number;
    segments: ChartSegment[];
  };

  let {
    days,
    maxTotal,
    gap = "gap-1",
  }: {
    days: ChartDay[];
    maxTotal: number;
    gap?: string;
  } = $props();
</script>

<div class="h-48 flex items-end {gap} w-full border-b border-zinc-800 pb-1">
  {#each days as day}
    {@const heightPercent = maxTotal > 0 ? (day.total / maxTotal) * 100 : 0}
    <div
      class="relative flex-1 flex flex-col justify-end group/bar hover:opacity-100 transition-opacity"
      style="height: 100%; {maxTotal > 0 ? 'opacity: 0.8;' : ''}"
    >
      <div class="w-full flex flex-col overflow-hidden rounded-t-[1px]" style="height: {heightPercent}%;">
        {#each day.segments as seg}
          {#if seg.value > 0}
            <div
              class="{seg.colorClass} w-full transition-all"
              style="height: {(seg.value / (day.total || 1)) * 100}%"
            ></div>
          {/if}
        {/each}
      </div>

      <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-zinc-700">
        <p class="font-bold text-white mb-1 border-b border-zinc-700 pb-1">{day.date}</p>
        <div class="flex flex-col gap-0.5">
          {#each day.segments as seg}
            {#if seg.value > 0}
              <span class="{seg.textClass}">{seg.label}: {seg.tooltipValue}</span>
            {/if}
          {/each}
          {#if day.total === 0}
            <span class="text-zinc-500">No usage</span>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

<div class="flex justify-between items-center mt-2 text-[10px] text-zinc-500 font-mono">
  <span>{days[0]?.date || ''}</span>
  <span>Today</span>
</div>