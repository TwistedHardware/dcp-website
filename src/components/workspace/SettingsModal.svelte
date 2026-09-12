<script lang="ts">
  import { createEventDispatcher, afterUpdate } from "svelte";
  import { fade, fly } from "svelte/transition";

  const dispatch = createEventDispatcher();

  // Mocked state - will be fetched from your Go backend
  let apiKeys = [
    { id: "key_1", name: "Production App", prefix: "dcp_live_8f92", createdAt: "Sep 10, 2026" },
    { id: "key_2", name: "CLI Runner", prefix: "dcp_live_1102", createdAt: "Sep 12, 2026" }
  ];

  let isGenerating = false;
  let newKeyName = "";
  let newlyGeneratedKey: string | null = null;
  let copied = false;

  function handleGenerate() {
    if (!newKeyName.trim()) return;
    
    // Mocking the backend generation response
    const mockFullKey = `dcp_live_${crypto.randomUUID().replace(/-/g, '')}`;
    
    apiKeys = [
      { 
        id: crypto.randomUUID(), 
        name: newKeyName, 
        prefix: mockFullKey.substring(0, 13), 
        createdAt: "Just now" 
      },
      ...apiKeys
    ];
    
    newlyGeneratedKey = mockFullKey;
    isGenerating = false;
    newKeyName = "";
  }

  function revokeKey(id: string) {
    // Call backend to revoke, then update UI
    apiKeys = apiKeys.filter(k => k.id !== id);
  }

  async function copyToClipboard() {
    if (newlyGeneratedKey) {
      await navigator.clipboard.writeText(newlyGeneratedKey);
      copied = true;
      setTimeout(() => copied = false, 2000);
    }
  }

  function resetView() {
    newlyGeneratedKey = null;
  }

  afterUpdate(() => {
    if (window.lucide) window.lucide.createIcons();
  });
</script>

<div 
  class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4"
  transition:fade={{ duration: 200 }}
  on:click={() => dispatch("close")}
>
  <div 
    class="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    transition:fly={{ y: 20, duration: 300, opacity: 0 }}
    on:click|stopPropagation
  >
    <!-- Header -->
    <div class="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
          <i data-lucide="terminal" class="w-5 h-5 text-sky-400"></i>
        </div>
        <div>
          <h2 class="text-base font-semibold text-zinc-100">API Access</h2>
          <p class="text-xs text-zinc-400">Generate keys to access DCP Cloud APIs programmatically.</p>
        </div>
      </div>
      <button 
        on:click={() => dispatch("close")}
        class="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800"
      >
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <div class="p-6">
      
      {#if newlyGeneratedKey}
        <!-- SUCCESS STATE: Show newly generated key -->
        <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-2">
          <div class="flex items-start gap-3">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400 mt-0.5 shrink-0"></i>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-emerald-100 mb-1">Save your new secret key</h3>
              <p class="text-xs text-emerald-200/70 mb-4">
                Please copy this key and save it somewhere secure. For security reasons, <strong>you will not be able to view it again</strong>.
              </p>
              
              <div class="flex items-center gap-2">
                <code class="flex-1 bg-zinc-950 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono select-all">
                  {newlyGeneratedKey}
                </code>
                <button 
                  on:click={copyToClipboard}
                  class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
                >
                  {#if copied}
                    <i data-lucide="check" class="w-4 h-4"></i> Copied
                  {:else}
                    <i data-lucide="copy" class="w-4 h-4"></i> Copy
                  {/if}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button 
            on:click={resetView}
            class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            Done
          </button>
        </div>

      {:else}
        <!-- DEFAULT STATE: List Keys & Generate Form -->
        
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-zinc-200">Secret Keys</h3>
          {#if !isGenerating}
            <button 
              on:click={() => isGenerating = true}
              class="text-xs bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create new secret key
            </button>
          {/if}
        </div>

        {#if isGenerating}
          <div class="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <label class="block text-xs font-medium text-zinc-400 mb-2">Name your key</label>
            <div class="flex items-center gap-3">
              <input 
                type="text"
                bind:value={newKeyName}
                placeholder="e.g., Production Backend"
                class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                on:keydown={(e) => e.key === 'Enter' && handleGenerate()}
                autofocus
              />
              <button 
                on:click={() => { isGenerating = false; newKeyName = ""; }}
                class="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-2 transition"
              >
                Cancel
              </button>
              <button 
                on:click={handleGenerate}
                disabled={!newKeyName.trim()}
                class="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Create Key
              </button>
            </div>
          </div>
        {/if}

        <div class="bg-zinc-950/50 border border-zinc-800/80 rounded-xl overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-zinc-900/50 border-b border-zinc-800 text-xs text-zinc-400 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3 font-medium">Name</th>
                <th class="px-4 py-3 font-medium">Secret Key</th>
                <th class="px-4 py-3 font-medium">Created</th>
                <th class="px-4 py-3 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-800/80">
              {#if apiKeys.length === 0}
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-zinc-500 text-sm">
                    No API keys generated yet.
                  </td>
                </tr>
              {/if}
              {#each apiKeys as key (key.id)}
                <tr class="hover:bg-zinc-900/30 transition-colors">
                  <td class="px-4 py-3 text-zinc-200 font-medium">{key.name}</td>
                  <td class="px-4 py-3 font-mono text-zinc-400 text-xs">{key.prefix}••••••••••••</td>
                  <td class="px-4 py-3 text-zinc-500 text-xs">{key.createdAt}</td>
                  <td class="px-4 py-3 text-right">
                    <button 
                      on:click={() => revokeKey(key.id)}
                      class="text-zinc-500 hover:text-rose-400 transition p-1.5 rounded hover:bg-rose-500/10"
                      title="Revoke Key"
                    >
                      <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>