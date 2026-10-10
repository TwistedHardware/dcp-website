<script lang="ts">
  import { timeFilter, setTimeFilter } from "./lib/filter.svelte";
  import type { TimeFilter } from "./types";

  let { lang = "en" }: { lang?: string } = $props();

  const OPTIONS: { value: TimeFilter; label: string }[] = [
    { value: 30, label: "30d" },
    { value: 90, label: "90d" },
    { value: 365, label: "1y" },
  ];
</script>

<div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1 w-fit">
  {#each OPTIONS as opt}
    <button
      onclick={() => setTimeFilter(opt.value)}
      class="px-4 py-1.5 text-xs font-medium rounded-md transition-colors {timeFilter.value === opt.value
        ? 'bg-zinc-800 text-zinc-100 shadow-sm'
        : 'text-zinc-500 hover:text-zinc-300'}"
    >
      {opt.label}
    </button>
  {/each}
</div>