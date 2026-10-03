<script lang="ts">
  import { onMount } from 'svelte';
  import ModelHub from './ModelHub.svelte';

  // Types for the state
  interface Model {
    name: string;
    companyLogo?: string;
    pricePerHour: number;
    type: 'text-to-text' | 'image-to-text' | 'text-to-image' | 'audio-to-text' | 'image-text-to-text';
    params: string;
    downloads: string;
    releaseDate: string;
    description: string;
    isPrivate?: boolean;
		vRam: number;
  }

  interface ActiveInstance {
    id: string;
    modelName: string;
    vRamUsage: number;
    status: 'running' | 'starting' | 'stopping';
    startTime: string;
  }

  // Fixed Mock Data with working placeholder images
  let publicModels = $state<Model[]>([
    { name: 'GLM-5.3-Flash', companyLogo: 'https://cdn-avatars.huggingface.co/v1/production/uploads/62dc173789b4cf157d36ebee/i_pxzM2ZDo3Ub-BEgIkE9.png', vRam: 512, pricePerHour: 102.40, type: 'image-text-to-text', params: '321B', downloads: '5.27M', releaseDate: '2024-08-05', description: 'GLM-5.3-Flash is a native multimodal MoE model (320B total/18B active) using hybrid sparse-linear attention to deliver frontier-level coding and agentic performance at a tenth of the cost.' },
    { name: 'Qwen/Qwen3.8-27B', companyLogo: 'https://cdn-avatars.huggingface.co/v1/production/uploads/6215ca5692c0ecfba9186921/hrRM50-6XcdWgg2AKpENG.jpeg', vRam: 96, pricePerHour: 19.20, type: 'image-text-to-text', params: '27B', downloads: '6.93M', releaseDate: '2026-08-14', description: 'Built on Qwen3.5, Qwen3.8-27B is a deployment-friendly vision-language model with flexible thinking control, delivering major gains in coding, research, and reliable multi-step agentic tasks. Running os 256K token context window.' },
    { name: 'Qwen-Image-2.1', companyLogo: 'https://cdn-avatars.huggingface.co/v1/production/uploads/6215ca5692c0ecfba9186921/hrRM50-6XcdWgg2AKpENG.jpeg', vRam: 48, pricePerHour: 9.60, type: 'text-to-image', params: '7B', downloads: '81.7K', releaseDate: '2026-09-29', description: 'Qwen-Image-2.1 is an open-source, 7B-parameter unified model for text-to-image generation and image editing. Built on 32 Single-Stream DiT layers, it balances high-quality visual generation, efficiency, and versatility.' },
  ]);

  let myModels = $state<Model[]>([
    { name: 'Custom-FineTune-V1', vRam: 40, pricePerHour: 0.25, type: 'text-to-text', params: '7B', downloads: '0', releaseDate: '2026-09-01', description: 'My private domain-specific fine-tune.' },
  ]);

  let activeInstances = $state<ActiveInstance[]>([
    { id: 'inst-1', modelName: 'Llama-3-8B', vRamUsage: 16, status: 'running', startTime: '2026-10-02T20:00:00Z' },
  ]);

  function handleDeploy(name: string) {
    console.log(`Deploying ${name}...`);
  }

  function terminateInstance(id: string) {
    activeInstances = activeInstances.filter(inst => inst.id !== id);
  }

  onMount(() => {
    if (typeof window !== 'undefined' && window.lucide) {
      window.lucide.createIcons();
    }
  });
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
    
    <ModelHub 
      {publicModels} 
      {myModels} 
      onDeploy={handleDeploy} 
    />
  </section>
</div>