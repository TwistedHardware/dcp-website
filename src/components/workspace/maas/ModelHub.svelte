<script lang="ts">
  import { onMount } from 'svelte';
  import ModelCard from './ModelCard.svelte';

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

  let { 
    publicModels = [], 
    myModels = [], 
    onDeploy 
  }: { 
    publicModels: Model[], 
    myModels: Model[], 
    onDeploy: (name: string) => void 
  } = $props();

  let activeTab = $state('public');
  let searchQuery = $state('');
  let selectedType = $state('all');
  let sortBy = $state('popularity');

  // Derived state for filtered models
  let filteredModels = $derived(() => {
    const list = activeTab === 'public' ? publicModels : myModels;
    
    return list
      .filter(m => 
        (m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
         m.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedType === 'all' || m.type === selectedType)
      )
      .sort((a, b) => {
        if (sortBy === 'cost') return a.pricePerHour - b.pricePerHour;
        if (sortBy === 'date') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
        return 0; 
      });
  });

  onMount(() => {
    if (typeof window !== 'undefined' && window.lucide) {
      window.lucide.createIcons();
    }
  });
</script>

<div class="flex flex-col gap-6">
  <!-- Header Actions: Tabs, Search, and Filters -->
  <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    
    <!-- Tab Switcher -->
    <div class="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-fit">
      <button 
        onclick={() => (activeTab = 'public')}
        class={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'public' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        Public Models
      </button>
      <button 
        onclick={() => (activeTab = 'my')}
        class={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === 'my' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        My Models
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <!-- Search Input -->
      <div class="relative">
        <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"></i>
        <input 
          type="text" 
          bind:value={searchQuery}
          placeholder="Search models..."
          class="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500/50 transition-all w-64"
        />
      </div>

      <!-- Type Filter -->
      <select 
        bind:value={selectedType}
        class="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 focus:outline-none"
      >
        <option value="all">All Types</option>
        <option value="text-to-text">Text-to-Text</option>
        <option value="image-to-text">Image-to-Text</option>
        <option value="text-to-image">Text-to-Image</option>
      </select>

      <!-- Sort Dropdown -->
      <select 
        bind:value={sortBy}
        class="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-400 focus:outline-none"
      >
        <option value="popularity">Popularity</option>
        <option value="cost">Cheapest</option>
        <option value="date">Newest</option>
      </select>
    </div>
  </div>

  <!-- Grid of Model Cards -->
  {#if filteredModels().length === 0}
    <div class="py-20 text-center">
      <i data-lucide="database" class="w-12 h-12 text-zinc-800 mx-auto mb-4"></i>
      <p class="text-zinc-500 text-sm">No models found matching your criteria.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {#each filteredModels() as model}
        <ModelCard {model} onDeploy={onDeploy} />
      {/each}
    </div>
  {/if}
</div>