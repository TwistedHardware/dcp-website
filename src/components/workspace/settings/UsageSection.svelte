<script lang="ts">
  import { onMount } from "svelte";
    import SaudiRiyal from "../SaudiRiyal.svelte";

  let { lang = "en" }: { lang?: string } = $props();

  type UsageItem = {
    _id: string;
    subject: string;
    source: string;
    date: string;
    inputTokens: number;
    outputTokens: number;
    cacheHitTokens: number;
    totalWeightedTokens: number;
  };

  // --- State ---
  let timeFilter = $state<30 | 90 | 365>(30);
  let usageData = $state<UsageItem[]>([]);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);

  const API_BASE = "https://api.dcp.tc-sa.com";
  const RATE_PER_MILLION = 7.5; // SAR per 1,000,000 weighted tokens

  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("token") || "";
    const subject = localStorage.getItem("subject") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-subject": subject,
    };
  }

  function handleUnauthorized() {
    window.location.href = `/${lang}/`;
  }

  async function loadUsage(days: number) {
    isLoading = true;
    loadError = null;
    try {
      // Passing the days filter as a query param (ready for backend implementation)
      const res = await fetch(`${API_BASE}/api/usage?days=${days}`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.error || "Failed to load usage data");

      usageData = (data.usage ?? []) as UsageItem[];
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading = false;
    }
  }

  // Reload data whenever the time filter changes
  $effect(() => {
    loadUsage(timeFilter);
  });

  // --- Data Processing & Calculation ---

  // 1. Filter out chat sources
  let filteredData = $derived(
    usageData.filter((item) => item.source !== "chat")
  );

  // 2. Aggregate filtered data by Date
  let dailyAggregates = $derived.by(() => {
    const map = new Map<string, { input: number; output: number; cache: number; totalW: number }>();
    for (const d of filteredData) {
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

  // 3. Generate contiguous dates ending at "today" and filling missing days with 0
  let chartData = $derived.by(() => {
    const result = [];
    const today = new Date(); // Local browser time
    
    for (let i = timeFilter - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]; // YYYY-MM-DD
      
      const agg = dailyAggregates.get(dateStr) || { input: 0, output: 0, cache: 0, totalW: 0 };
      result.push({ 
        date: dateStr, 
        ...agg, 
        rawTotal: agg.input + agg.output + agg.cache 
      });
    }
    return result;
  });

  // 4. Calculate accounting totals
  let totalWeightedTokens = $derived(
    chartData.reduce((sum, day) => sum + day.totalW, 0)
  );
  
  let totalCost = $derived(
    (totalWeightedTokens * RATE_PER_MILLION) / 1_000_000
  );

  // 5. Chart Scaling logic
  let maxStack = $derived(
    Math.max(...chartData.map((d) => d.rawTotal), 0)
  );

  // --- Formatters ---
  const formatNumber = (num: number) => new Intl.NumberFormat(lang).format(num);
  const formatCurrency = (num: number) => new Intl.NumberFormat(lang, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(num);

  $effect(() => {
    void isLoading;
    void chartData.length;
    queueMicrotask(() => window.lucide?.createIcons());
  });
</script>

<div class="space-y-6">

  <!-- Part 1: Top-Level Placeholders (Balance & Total System Cost) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <!-- Balance Card -->
    <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col justify-between">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-sm font-medium text-zinc-400">Current Balance</h3>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-3xl font-bold text-white">1,000.00</span>
            <SaudiRiyal class="text-3xl"/>
          </div>
        </div>
        <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
          <i data-lucide="wallet" class="w-5 h-5"></i>
        </div>
      </div>
      <button class="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold py-2.5 rounded-xl transition-colors text-sm">
        Top Up Balance
      </button>
    </div>

    <!-- Total Lifetime Cost Placeholder -->
    <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col justify-between">
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="text-sm font-medium text-zinc-400">Lifetime Usage Cost</h3>
          <div class="flex items-baseline gap-1 mt-1">
            <span class="text-3xl font-bold text-white">312.45</span>
            <SaudiRiyal class="text-3xl"/>
          </div>
        </div>
        <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
          <i data-lucide="line-chart" class="w-5 h-5"></i>
        </div>
      </div>
      <div class="w-full bg-zinc-800/50 py-2.5 rounded-xl text-center text-zinc-500 text-xs font-medium border border-zinc-800">
        Updated in real-time
      </div>
    </div>
  </div>


  <!-- Part 2 & 3: Filtered Usage Metrics & Chart -->
  <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm space-y-6">
    
    <!-- Header & Filter -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h3 class="text-base font-semibold text-zinc-200">API Usage Metrics</h3>
      
      <!-- Date Filter -->
      <div class="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1">
        {#each [30, 90, 365] as days}
          <button
            onclick={() => timeFilter = days as 30|90|365}
            class="px-4 py-1.5 text-xs font-medium rounded-md transition-colors {timeFilter === days ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}"
          >
            {days === 365 ? '1y' : `${days}d`}
          </button>
        {/each}
      </div>
    </div>

    {#if isLoading}
      <div class="py-20 flex flex-col items-center justify-center text-zinc-500">
        <i data-lucide="loader-2" class="w-6 h-6 animate-spin mb-3"></i>
        <p class="text-sm">Loading usage data...</p>
      </div>
    {:else if loadError}
      <div class="py-10 text-center text-rose-400 text-sm bg-rose-500/10 rounded-xl border border-rose-500/20">
        Failed to load usage data: {loadError}
      </div>
    {:else}
      <!-- Filtered Stats Cards -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
          <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Total API Tokens</p>
          <p class="text-2xl font-bold text-zinc-200">{formatNumber(totalWeightedTokens)}</p>
        </div>
        <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-4">
          <p class="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">API Cost</p>
          <div class="flex items-baseline gap-1">
            <span class="text-2xl font-bold text-emerald-400">{formatCurrency(totalCost)}</span>
            <SaudiRiyal class="text-emerald-400 text-2xl"/>
          </div>
        </div>
      </div>

      <!-- Custom Stacked Bar Chart -->
      <div class="pt-4">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-medium text-zinc-300">Daily Token Volume (Raw)</h4>
          <!-- Legend -->
          <div class="flex items-center gap-4 text-[10px] uppercase tracking-wider font-medium text-zinc-400">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-600"></span> Input</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> Output</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Cache Hit</span>
          </div>
        </div>
        
        <!-- Chart Container -->
        <div class="h-48 flex items-end {timeFilter === 365 ? 'gap-[1px]' : 'gap-1'} w-full border-b border-zinc-800 pb-1 group/chart">
          {#each chartData as day}
            {@const heightPercent = maxStack > 0 ? (day.rawTotal / maxStack) * 100 : 0}
            <div 
              class="relative flex-1 flex flex-col justify-end group/bar hover:opacity-100 transition-opacity" 
              style="height: 100%; {maxStack > 0 ? 'opacity: 0.8;' : ''}"
            >
              <!-- The Stack -->
              <div class="w-full flex flex-col overflow-hidden rounded-t-[1px]" style="height: {heightPercent}%;">
                <!-- Stacking Order: Cache (Top), Output (Middle), Input (Bottom) -->
                <div class="bg-amber-400 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.cache / day.rawTotal) * 100 : 0}%"></div>
                <div class="bg-amber-500 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.output / day.rawTotal) * 100 : 0}%"></div>
                <div class="bg-amber-600 w-full transition-all" style="height: {day.rawTotal > 0 ? (day.input / day.rawTotal) * 100 : 0}%"></div>
              </div>

              <!-- CSS Tooltip -->
              <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-800 text-zinc-200 text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-zinc-700">
                <p class="font-bold text-white mb-1 border-b border-zinc-700 pb-1">{day.date}</p>
                <div class="flex flex-col gap-0.5">
                  <span class="text-amber-600">Input: {formatNumber(day.input)}</span>
                  <span class="text-amber-500">Output: {formatNumber(day.output)}</span>
                  <span class="text-amber-400">Cache: {formatNumber(day.cache)}</span>
                </div>
              </div>
            </div>
          {/each}
        </div>
        
        <!-- X Axis labels (Start and End dates) -->
        <div class="flex justify-between items-center mt-2 text-[10px] text-zinc-500 font-mono">
          <span>{chartData[0]?.date || ''}</span>
          <span>Today</span>
        </div>

      </div>
    {/if}
  </div>

</div>