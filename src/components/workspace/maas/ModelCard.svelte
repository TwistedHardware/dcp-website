<script lang="ts">
  interface ModelCardProps {
    model: {
      name: string;
      companyLogo?: string;
      pricePerHour: number;
      type: 'text-to-text' | 'image-to-text' | 'text-to-image' | 'audio-to-text' | 'image-text-to-text';
      params: string;
      vRam: number; // Added vRAM property (in GB)
      downloads: string;
      releaseDate: string;
      description: string;
      isPrivate?: boolean;
    };
    onDeploy: (modelName: string) => void;
  }

  let { model, onDeploy }: ModelCardProps = $props();

  const typeStyles = {
    'text-to-text': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'image-to-text': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'text-to-image': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'audio-to-text': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
		'image-text-to-text': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
</script>

<div class="group relative flex flex-col p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-zinc-700 transition-all duration-200">
  
  <!-- Row 1: Icon & Name -->
  <div class="flex items-center gap-3 mb-2.5">
    {#if model.companyLogo}
      <img src={model.companyLogo} alt="" class="w-7 h-7 rounded-full object-contain bg-zinc-800" />
    {:else}
      <div class="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">
        <i data-lucide="bot" class="w-3.5 h-3.5 text-zinc-500"></i>
      </div>
    {/if}
    <span class="font-semibold text-zinc-100 text-base truncate">{model.name}</span>
  </div>
  
  <!-- Row 2: Modality & Price -->
  <div class="flex items-center justify-between mb-4">
    <span class={`text-[10px] font-medium whitespace-nowrap px-2.5 py-1 rounded-full border ${typeStyles[model.type]}`}>
      {model.type.replace(/-/g, ' ')}
    </span>
    
    <div class="flex items-baseline gap-1 bg-zinc-950/50 border border-zinc-800/50 px-2 py-1 rounded-lg">
      <span class="text-xs font-mono font-bold text-sky-400">
        {model.pricePerHour}
      </span>
      <span class="text-[9px] font-medium text-zinc-500 uppercase tracking-wider">
        SAR/hr
      </span>
    </div>
  </div>

  <!-- Description -->
  <p class="text-xs text-zinc-400 line-clamp-6 mb-4 leading-relaxed flex-1">
    {model.description}
  </p>

  <!-- Metadata Grid (Updated to 2x2) -->
  <div class="grid grid-cols-2 gap-y-3 gap-x-2 py-3 border-t border-zinc-800/50 mb-4">
    <div class="flex flex-col">
      <span class="text-[9px] uppercase tracking-wider text-zinc-500">Params</span>
      <span class="text-xs text-zinc-300 font-medium">{model.params}</span>
    </div>
    <div class="flex flex-col">
      <span class="text-[9px] uppercase tracking-wider text-zinc-500">Req. vRAM</span>
      <span class="text-xs text-zinc-300 font-medium">{model.vRam} GB</span>
    </div>
    <div class="flex flex-col">
      <span class="text-[9px] uppercase tracking-wider text-zinc-500">Downloads</span>
      <span class="text-xs text-zinc-300 font-medium">{model.downloads}</span>
    </div>
    <div class="flex flex-col">
      <span class="text-[9px] uppercase tracking-wider text-zinc-500">Released</span>
      <span class="text-xs text-zinc-300 font-medium">{model.releaseDate}</span>
    </div>
  </div>

  <!-- Action -->
  <button 
    type="button"
    onclick={() => onDeploy(model.name)}
    class="w-full py-2.5 rounded-xl bg-zinc-100 text-zinc-950 text-xs font-bold hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all"
  >
    Deploy Model
  </button>
</div>