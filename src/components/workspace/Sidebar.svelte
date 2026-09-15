<script lang="ts">
  // Svelte 5: props via $props()
  let {
    sessions = [],
    isSecretMode = false,
    isOpen = true,
    onNewSession,
    onStartSecret,
    onSelectSession,
    onOpenSettings
  }: {
    sessions?: Array<{ id: string; title: string; timestamp: string }>;
    isSecretMode?: boolean;
    isOpen?: boolean;
    onNewSession?: () => void;
    onStartSecret?: () => void;
    onSelectSession?: (payload: { id: string }) => void;
    onOpenSettings?: () => void;
  } = $props();

  // Svelte 5: $effect replaces onMount + afterUpdate.
  // Runs after DOM updates, so lucide icons re-render correctly.
  $effect(() => {
    // Reading `sessions` and `isSecretMode` here makes the effect re-run
    // when either changes, matching the old afterUpdate behavior.
    void sessions;
    void isSecretMode;

    if (typeof window !== "undefined" && window.lucide) {
      window.lucide.createIcons();
    }
  });
</script>

<aside
  class={`flex flex-col bg-zinc-950 border-r border-zinc-800/80 transition-all duration-300 ease-in-out z-20 ${
    isOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full border-r-0"
  } overflow-hidden shrink-0`}
>
  <div class="p-4 flex flex-col h-full w-72">
    <!-- Brand / Logo Area -->
    <div class="flex items-center gap-3 mb-8 px-2 mt-2">
      <div class="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 p-[1px]">
        <div class="h-full w-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
          <i data-lucide="cpu" class="w-4 h-4 text-sky-400"></i>
        </div>
      </div>
      <span class="font-semibold text-zinc-100 tracking-tight">DCP Cloud</span>
    </div>

    <!-- Primary Actions -->
    <div class="space-y-3 mb-8">
      <button
        onclick={() => onNewSession?.()}
        class={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium ${
          !isSecretMode
            ? "bg-zinc-800/50 border-zinc-700 text-zinc-100"
            : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
        }`}
      >
        <i data-lucide="plus" class="w-4 h-4"></i>
        New Workspace
      </button>

      <!-- The ZKS Ignition Button -->
      <button
        onclick={() => onStartSecret?.()}
        class={`w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-sm font-medium overflow-hidden ${
          isSecretMode
            ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
            : "border-zinc-800 hover:border-indigo-500/30 text-zinc-400 hover:text-indigo-300 hover:bg-indigo-500/5"
        }`}
      >
        <i data-lucide="shield-alert" class="w-4 h-4 z-10 transition-colors"></i>
        <span class="z-10">Start Secret Session</span>
        {#if isSecretMode}
          <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent z-0"></div>
        {/if}
      </button>
    </div>

    <!-- Compute / Environments -->
    <div class="mb-8">
      <h3 class="px-3 text-[10px] font-semibold text-zinc-500 tracking-widest uppercase mb-2">Compute</h3>
      <button class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
        <i data-lucide="terminal-square" class="w-4 h-4"></i>
        Launch Jupyter Node
      </button>
    </div>

    <!-- Session History -->
    <div class="flex-1 overflow-y-auto mb-4 min-h-0">
      <h3 class="px-3 text-[10px] font-semibold text-zinc-500 tracking-widest uppercase mb-2">Recent</h3>

      {#if isSecretMode}
        <div class="mx-3 mt-4 p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center">
          <i data-lucide="lock" class="w-5 h-5 text-indigo-400 mx-auto mb-2 opacity-80"></i>
          <p class="text-xs text-zinc-400 font-medium leading-relaxed">
            History Vault Locked.<br/>ZKS Session Active.
          </p>
        </div>
      {:else}
        <div class="space-y-1">
          {#each sessions as session (session.id)}
            <button
              onclick={() => onSelectSession?.({ id: session.id })}
              class="w-full flex flex-col items-start px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors text-left group"
            >
              <span class="text-sm text-zinc-300 font-medium truncate w-full group-hover:text-zinc-100 transition-colors">
                {session.title}
              </span>
              <span class="text-[10px] text-zinc-500">{session.timestamp}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Footer: Settings & Profile -->
    <div class="pt-4 border-t border-zinc-800/80 mt-auto">
      <button
        onclick={() => onOpenSettings?.()}
        class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
      >
        <i data-lucide="settings-2" class="w-4 h-4"></i>
        Integration Vault
      </button>
    </div>
  </div>
</aside>