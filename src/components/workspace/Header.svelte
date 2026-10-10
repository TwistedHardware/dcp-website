<script lang="ts">
  import SaudiRiyal from './SaudiRiyal.svelte';

  const API_BASE = "https://api.dcp.tc-sa.com";

  let {
    lang = "en",
    isSidebarOpen = $bindable(true),
    pageTitle = "Workspace",
    subscriptionPlan = "Pro Tier",
  }: {
    lang?: string;
    isSidebarOpen?: boolean;
    pageTitle?: string;
    subscriptionPlan?: string;
  } = $props();

  // --- Balance fetch ---
  let balanceHalalas = $state<number | null>(null);
  let balanceLoading = $state(true);
  let balanceError = $state<string | null>(null);

  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("token") || "";
    const subject = localStorage.getItem("subject") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-subject": subject,
    };
  }

  async function loadBalance() {
    balanceLoading = true;
    balanceError = null;
    try {
      const res = await fetch(`${API_BASE}/api/balance`, {
        method: "GET",
        headers: authHeaders(),
      });
      if (res.status === 401) {
        // TODO: centralize logout
        console.warn("[header] unauthorized");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.error || "Failed to load balance");
      balanceHalalas = data.balance?.balance ?? 0;
    } catch (err) {
      balanceError = err instanceof Error ? err.message : String(err);
    } finally {
      balanceLoading = false;
    }
  }

  function formatBalance(halalas: number): string {
    return new Intl.NumberFormat(lang, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(halalas / 100);
  }

  function handleSignOut() {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    localStorage.removeItem("subject");
    window.location.href = `/${lang}/`;
  }

  $effect(() => {
    void isSidebarOpen;

    setTimeout(() => {
      if (typeof window !== "undefined" && window.lucide) {
        window.lucide.createIcons();
      }
    }, 10);
  });

  loadBalance();
</script>

<header class="h-16 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md flex-none px-4 sm:px-6 flex items-center justify-between z-10">

  <!-- Left Side: Navigation & Title -->
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

    <div class="flex items-center ms-1 sm:ms-2">
      <h1 class="font-semibold text-sm tracking-tight text-zinc-200">
        {pageTitle}
      </h1>
    </div>
  </div>

  <!-- Right Side: User Profile & Actions -->
  <div class="flex items-center gap-3">

    <!-- User Tag (Subscription | Balance) -->
    <div class="hidden sm:flex items-center bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden text-xs font-medium">
      <div class="px-3 py-1.5 bg-zinc-800/50 text-zinc-300 border-r border-zinc-800 flex items-center gap-1.5">
        <span class="inline-flex"><i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i></span>
        {subscriptionPlan}
      </div>
      <div class="px-3 py-1.5 text-zinc-400 font-mono flex items-baseline gap-1">
        {#if balanceLoading}
          <span class="inline-block w-12 h-3 bg-zinc-800 rounded animate-pulse"></span>
        {:else if balanceError}
          <span class="text-rose-400" title={balanceError}>--</span>
        {:else if balanceHalalas !== null}
          {formatBalance(balanceHalalas)}
          <SaudiRiyal class="text-lg -my-2" />
        {/if}
      </div>
    </div>

    <!-- Sign Out Action -->
    <button
      onclick={handleSignOut}
      class="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
      title="Sign out"
    >
      <i data-lucide="log-out" class="w-4 h-4"></i>
    </button>
  </div>
</header>