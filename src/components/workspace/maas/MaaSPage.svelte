<script lang="ts">
  import { onMount } from 'svelte';
  import ModelHub from './ModelHub.svelte';

  const API_BASE = "https://api.dcp.tc-sa.com";

  // --- API shape (matches the backend MaaSTemplate JSON) ---
  type ApiTemplate = {
    _id: string;
    name: string;
    modelName: string;
    modelType: string;
    modelParams: number;
    modelDownloads: number;
    modelLastUpdate: string; // RFC3339
    modelDescription: string;
    huggingFaceURL: string;
    iconURL: string;
    vRAM: number;
    pricePerHour: number; // halalas/hour
    ownerId: string; // "" => public
    available: boolean;
  };

  // --- View shape (what ModelHub and the markup already use) ---
  interface Model {
		id: string;
		name: string;
		companyLogo?: string;
		pricePerHour: number;
		type: 'text-to-text' | 'image-to-text' | 'text-to-image' | 'audio-to-text' | 'image-text-to-text';
		params: string;
		downloads: string;        // formatted, for display
		downloadsRaw: number;     // raw count, for sorting
		releaseDate: string;
		description: string;
		isPrivate?: boolean;
		available: boolean;
		vRAM: number;
		huggingFaceURL: string;
	}

  interface ActiveInstance {
    id: string;
    modelName: string;
    vRamUsage: number;
    status: 'running' | 'starting' | 'stopping';
    startTime: string;
  }

  // --- Formatters (compact display for params/downloads) ---
  function formatParams(n: number): string {
    if (n >= 1e12) return (n / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
    if (n >= 1e9)  return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
    if (n >= 1e6)  return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    return String(n);
  }

  function formatDownloads(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.?0+$/, "") + "K";
    return String(n);
  }

  function toModel(t: ApiTemplate): Model {
		return {
			id: t._id,
			name: t.name,
			companyLogo: t.iconURL,
			pricePerHour: t.pricePerHour / 100,
			type: t.modelType as Model['type'],
			params: formatParams(t.modelParams),
			downloads: formatDownloads(t.modelDownloads),
			downloadsRaw: t.modelDownloads,
			releaseDate: t.modelLastUpdate.split("T")[0],
			description: t.modelDescription,
			isPrivate: t.ownerId !== "",
			available: t.available,
			vRAM: t.vRAM,
			huggingFaceURL: t.huggingFaceURL,
		};
	}

  // --- State ---
  let templates = $state<ApiTemplate[]>([]);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);

  let publicModels = $derived(
    templates.filter((t) => t.ownerId === "").map(toModel)
  );
  let myModels = $derived(
    templates.filter((t) => t.ownerId !== "").map(toModel)
  );

  let activeInstances = $state<ActiveInstance[]>([
    // { id: 'inst-1', modelName: 'Llama-3-8B', vRamUsage: 16, status: 'running', startTime: '2026-10-02T20:00:00Z' },
  ]);

  // --- Fetch ---
  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("token") || "";
    const subject = localStorage.getItem("subject") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-subject": subject,
    };
  }

  async function loadTemplates() {
    isLoading = true;
    loadError = null;
    try {
      const res = await fetch(`${API_BASE}/api/maas/templates`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (res.status === 401) {
        // TODO: centralize logout
        console.warn("[maas] unauthorized");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.error || "Failed to load templates");
      templates = (data.templates ?? []) as ApiTemplate[];
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadTemplates();
  });

  function handleDeploy(name: string) {
    console.log(`Deploying ${name}...`);
  }

  function terminateInstance(id: string) {
    activeInstances = activeInstances.filter(inst => inst.id !== id);
  }
</script>

<div class="min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-10 space-y-12">
  
  <!-- Header & Features Section -->
  <header class="max-w-6xl mx-auto space-y-8">
    
    <!-- Hero Text -->
    <div class="max-w-3xl space-y-3">
      <h1 class="text-4xl font-bold tracking-tight text-white">Model-as-a-Service (MaaS)</h1>
      <p class="text-zinc-400 text-lg leading-relaxed">
        Deploy state-of-the-art AI models on <span class="text-zinc-200 font-medium">fully dedicated hardware</span>. 
        Your models remain permanently resident in vRAM, guaranteeing instant inference with zero cold-start latency.
      </p>
    </div>

    <!-- Value Prop & Pricing Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      
      <!-- Privacy Card -->
      <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col hover:border-zinc-700 transition-colors">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
          <h2 class="font-semibold text-zinc-200 leading-snug">Absolute Privacy</h2>
        </div>
        <p class="text-sm text-zinc-400 leading-relaxed flex-1">
          <span class="text-zinc-200 font-medium">Zero KV cache sharing.</span> A completely private environment eliminating all data leakage and reverse engineering risks.
        </p>
      </div>

      <!-- Performance Card -->
      <div class="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm flex flex-col hover:border-zinc-700 transition-colors">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
            <i data-lucide="zap" class="w-5 h-5"></i>
          </div>
          <h2 class="font-semibold text-zinc-200 leading-snug">Unthrottled Power</h2>
        </div>
        <p class="text-sm text-zinc-400 leading-relaxed flex-1">
          Consistent performance without rate limits. We provision the exact dedicated hardware footprint your architecture demands.
        </p>
      </div>

      <!-- Pricing Card -->
      <div class="p-6 rounded-2xl border border-emerald-900/30 bg-gradient-to-br from-emerald-900/10 to-zinc-900/40 backdrop-blur-sm flex flex-col relative overflow-hidden shadow-lg hover:border-emerald-700/50 transition-colors">
        <!-- Subtle background glow for pricing -->
        <div class="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full"></div>
        
        <div class="flex items-center gap-3 mb-4 relative z-10">
          <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <i data-lucide="credit-card" class="w-5 h-5"></i>
          </div>
          <h2 class="font-semibold text-zinc-200 leading-snug">Fair Pricing</h2>
        </div>
        
        <!-- Moved badge to the middle to fill the empty space -->
        <div class="relative z-10 flex-1 flex flex-col items-start gap-2.5">
          <span class="text-[10px] uppercase tracking-wider text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded">Billed Per Second</span>
          <p class="text-[13px] text-zinc-400 leading-relaxed">
            Pay only for what you use. Billed purely on active vRAM allocation.
          </p>
        </div>
        
        <div class="relative z-10 mt-4 pt-4 border-t border-emerald-900/30">
          <div class="flex items-baseline gap-1.5">
            <span class="text-3xl font-bold text-white">0.20</span>
            <span class="text-zinc-400 text-sm font-medium">SAR / hr / GB</span>
          </div>
        </div>
      </div>

    </div>
  </header>

  <!-- Active Instances Zone -->
  <section class="max-w-6xl mx-auto space-y-4">
    <div class="flex items-center justify-between border-b border-zinc-800 pb-2">
      <h3 class="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Running Instances</h3>
      <span class="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-medium">
        {activeInstances.length} Active
      </span>
    </div>

    {#if activeInstances.length === 0}
      <div class="p-8 rounded-2xl border border-dashed border-zinc-800 text-center text-zinc-600 text-sm">
        No models are currently running. Start by deploying one from the hub below.
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each activeInstances as instance}
          <div class="p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 flex items-center justify-between group hover:border-zinc-700 transition-colors">
            <div class="flex items-center gap-3">
              <div class="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <div>
                <p class="text-sm font-medium text-zinc-200">{instance.modelName}</p>
                <p class="text-[11px] text-zinc-500 mt-0.5">{instance.vRamUsage}GB vRAM Allocated</p>
              </div>
            </div>
            <button 
              onclick={() => terminateInstance(instance.id)}
              class="p-2 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-zinc-700/50 hover:border-red-500/20"
              title="Terminate Instance"
            >
              <i data-lucide="power" class="w-4 h-4"></i>
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Discovery Hub Zone -->
  <section class="max-w-6xl mx-auto space-y-4 pb-20">
		<div class="flex items-center justify-between border-b border-zinc-800 pb-2">
			<h3 class="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Model Discovery Hub</h3>
			<a href="https://huggingface.co" target="_blank" class="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1.5 transition-colors">
				Browse HuggingFace <i data-lucide="external-link" class="w-3 h-3"></i>
			</a>
		</div>

		{#if isLoading}
			<div class="py-20 flex flex-col items-center justify-center text-zinc-500">
				<i data-lucide="loader-2" class="w-6 h-6 animate-spin mb-3"></i>
				<p class="text-sm">Loading templates...</p>
			</div>
		{:else if loadError}
			<div class="py-10 text-center text-rose-400 text-sm bg-rose-500/10 rounded-xl border border-rose-500/20">
				<p>Failed to load templates: {loadError}</p>
				<button
					onclick={loadTemplates}
					class="mt-3 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-500/20 hover:bg-rose-500/30 transition-colors"
				>
					Retry
				</button>
			</div>
		{:else}
			<ModelHub
				{publicModels}
				{myModels}
				onDeploy={handleDeploy}
			/>
		{/if}
	</section>
</div>