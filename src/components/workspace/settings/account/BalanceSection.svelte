<script lang="ts">
  import { Loader2, Wallet, LineChart } from "lucide-svelte";
  import SaudiRiyal from "../../SaudiRiyal.svelte";
  import { createFetcher } from "./lib/createFetcher.svelte";
  import { formatCurrencyFromBase } from "./lib/format";
  import type { Balance } from "./types";

  let { lang = "en" }: { lang?: string } = $props();

  const fetcher = createFetcher<Balance>({
    path: "/api/balance",
    dateScoped: false,
    lang,
    select: (json) => json.balance as Balance,
  });
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <!-- Balance Card -->
  <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col justify-between">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-sm font-medium text-zinc-400">Current Balance</h3>
        <div class="flex items-baseline gap-1 mt-1">
          {#if fetcher.isLoading}
            <Loader2 class="w-6 h-6 animate-spin text-zinc-500" />
          {:else if fetcher.error}
            <span class="text-sm text-rose-400">Failed to load</span>
          {:else if fetcher.data}
            <span class="text-3xl font-bold text-white">
              {formatCurrencyFromBase(fetcher.data.balance, lang)}
            </span>
            <SaudiRiyal class="text-3xl" />
          {/if}
        </div>
      </div>
      <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
        <Wallet class="w-5 h-5" />
      </div>
    </div>
    {#if fetcher.error}
      <button
        onclick={() => fetcher.retry()}
        class="w-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold py-2.5 rounded-xl transition-colors text-sm"
      >
        Retry
      </button>
    {:else}
      <button class="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl transition-colors text-sm">
        Top Up Balance
      </button>
    {/if}
  </div>

  <!-- Lifetime Cost Card -->
  <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col justify-between">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h3 class="text-sm font-medium text-zinc-400">Lifetime Usage Cost</h3>
        <div class="flex items-baseline gap-1 mt-1">
          {#if fetcher.isLoading}
            <Loader2 class="w-6 h-6 animate-spin text-zinc-500" />
          {:else if fetcher.error}
            <span class="text-sm text-rose-400">Failed to load</span>
          {:else if fetcher.data}
            <span class="text-3xl font-bold text-white">
              {formatCurrencyFromBase(fetcher.data.totalSpent, lang)}
            </span>
            <SaudiRiyal class="text-3xl" />
          {/if}
        </div>
      </div>
      <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
        <LineChart class="w-5 h-5" />
      </div>
    </div>
    <div class="w-full bg-zinc-800/50 py-2.5 rounded-xl text-center text-zinc-500 text-xs font-medium border border-zinc-800">
      Updated in real-time
    </div>
  </div>
</div>