<script lang="ts">
  let {
    lang = "en",
    i18n = {},
    isSecretMode = false,
    isSidebarOpen = $bindable(true),
    activeView = 'chat', // Added to track which page is active
    onresetSession,
  }: {
    lang?: string;
    i18n?: Record<string, string>;
    isSecretMode?: boolean;
    isSidebarOpen?: boolean;
    activeView?: 'chat' | 'maas';
    onresetSession?: () => void;
  } = $props();

  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("subject");
    window.location.href = `/${lang}/`;
  }

  $effect(() => {
    void isSecretMode;
    void isSidebarOpen;
    void activeView; // Track view changes for Lucide
    
    setTimeout(() => {
      if (typeof window !== "undefined" && window.lucide) {
        window.lucide.createIcons();
      }
    }, 10);
  });
</script>

<header
  class="h-16 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md flex-none px-4 sm:px-6 flex items-center justify-between z-10"
>
  <div class="flex items-center gap-2 sm:gap-3">
    <!-- Sidebar Toggle -->
    <button
      onclick={() => (isSidebarOpen = !isSidebarOpen)}
      aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      class="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
    >
      <i data-lucide="menu" class="w-5 h-5"></i>
    </button>

    <div class="flex items-center gap-3 ms-1 sm:ms-2">
      <h1 class="font-semibold text-sm tracking-tight text-zinc-200">
        {#if activeView === 'maas'}
          Model-as-a-Service
        {:else if isSecretMode}
          Hardware-Tethered Session
        {:else}
          {i18n.headerTitle || "Secure Workspace"}
        {/if}
      </h1>

      <!-- Telemetry Pill -->
      {#if activeView === 'maas'}
        <span class="bg-sky-500/10 text-sky-400 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1.5">
          <span class="inline-flex"><i data-lucide="server" class="w-3 h-3"></i></span> Dedicated Compute
        </span>
      {:else if isSecretMode}
        <span class="bg-indigo-500/10 text-indigo-400 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.2)]">
          <span class="inline-flex"><i data-lucide="key" class="w-3 h-3"></i></span> ZKS Active
        </span>
      {:else}
        <span class="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
        </span>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-3">
    <div class="hidden sm:flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-400">
      {#if activeView === 'maas'}
        <span class="inline-flex"><i data-lucide="cpu" class="w-3.5 h-3.5 text-emerald-400"></i></span>
        <span>Infrastructure Online</span>
      {:else if isSecretMode}
        <span class="inline-flex"><i data-lucide="shield-check" class="w-3.5 h-3.5 text-indigo-400"></i></span>
        <span>Ephemeral Memory</span>
      {:else}
        <span class="inline-flex"><i data-lucide="hard-drive" class="w-3.5 h-3.5 text-sky-400"></i></span>
        <span>{i18n.cacheStatus || "Local Context Encrypted"}</span>
      {/if}
    </div>

    <!-- Only show Reset Session in Chat view -->
    {#if activeView === 'chat'}
      <button
        onclick={() => onresetSession?.()}
        class="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-lg transition"
        title={i18n.reset || "Purge Session"}
      >
        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
      </button>
    {/if}
    
    <button
      onclick={handleSignOut}
      class="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
      title={i18n.signOut || "Sign out"}
    >
      <i data-lucide="log-out" class="w-4 h-4"></i>
    </button>
  </div>
</header>