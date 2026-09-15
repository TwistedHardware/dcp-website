<script lang="ts">
  import { fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  type ApiKey = {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;         // ISO 8601 from backend
    lastUsedAt?: string | null;
  };

  let {
    lang = "en",
    onclose
  }: {
    lang?: string;
    onclose?: () => void;
  } = $props();

  // --- State ---
  let apiKeys = $state<ApiKey[]>([]);
  let isLoading = $state(true);
  let loadError = $state<string | null>(null);

  let isGenerating = $state(false);
  let newKeyName = $state("");
  let isCreating = $state(false);
  let createError = $state<string | null>(null);

  let newlyGeneratedKey = $state<string | null>(null);
  let copied = $state(false);

  let revokingId = $state<string | null>(null);
  let revokeError = $state<string | null>(null);

  // --- Constants ---
  const API_BASE = "https://api.dcp.tc-sa.com";

  // --- Helpers ---
  function authHeaders(): HeadersInit {
    const token = localStorage.getItem("token") || "";
    const publicKey = localStorage.getItem("public_key") || "";
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-publickey-hex": publicKey,
    };
  }

  function handleUnauthorized() {
    window.location.href = `/${lang}/`;
  }

  function formatDate(iso: string | null | undefined): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(lang, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // --- Load list on mount ---
  async function loadKeys() {
    isLoading = true;
    loadError = null;
    try {
      const res = await fetch(`${API_BASE}/api/list-api-keys`, {
        method: "GET",
        headers: authHeaders(),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== "ok") throw new Error(data.error || "Failed to load keys");

      // Backend returns: { status, keys: [{ id, name, prefix, createdAt, lastUsedAt? }] }
      apiKeys = (data.keys ?? []) as ApiKey[];
    } catch (err) {
      loadError = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadKeys();
  });

  // --- Generate a new key ---
  async function handleGenerate() {
    if (!newKeyName.trim() || isCreating) return;

    isCreating = true;
    createError = null;

    try {
      const res = await fetch(`${API_BASE}/api/create-api-key`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status !== "ok" || !data.token || !data.key) {
        throw new Error(data.error || "Failed to generate key");
      }

      newlyGeneratedKey = data.token as string;

      // Prepend the real metadata the backend just persisted.
      apiKeys = [data.key as ApiKey, ...apiKeys];

      isGenerating = false;
      newKeyName = "";
    } catch (err) {
      createError = err instanceof Error ? err.message : String(err);
    } finally {
      isCreating = false;
    }
  }

  // --- Revoke ---
  async function revokeKey(id: string) {
    if (revokingId) return;
    revokingId = id;
    revokeError = null;

    try {
      const res = await fetch(`${API_BASE}/api/revoke-api-key/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      if (res.status === 401) return handleUnauthorized();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }

      // Only mutate local state after the server confirms.
      apiKeys = apiKeys.filter((k) => k.id !== id);
    } catch (err) {
      revokeError = err instanceof Error ? err.message : String(err);
    } finally {
      revokingId = null;
    }
  }

  async function copyToClipboard() {
    if (!newlyGeneratedKey) return;
    try {
      await navigator.clipboard.writeText(newlyGeneratedKey);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard can fail in insecure contexts; ignore.
    }
  }

  function resetView() {
    newlyGeneratedKey = null;
  }

  // --- Lucide refresh ---
  $effect(() => {
    void newlyGeneratedKey;
    void copied;
    void isLoading;
    void isGenerating;
    void apiKeys.length;
    void revokingId;
    queueMicrotask(() => window.lucide?.createIcons());
  });
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <button
    type="button"
    aria-label="Close dialog"
    class="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm cursor-default"
    transition:fade={{ duration: 200 }}
    onclick={() => onclose?.()}
  ></button>

  <div
    class="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
    transition:fly={{ y: 20, duration: 300, opacity: 0 }}
    role="dialog"
    aria-modal="true"
    aria-labelledby="settings-modal-title"
    tabindex="-1"
  >
    <!-- Header -->
    <div class="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
          <i data-lucide="terminal" class="w-5 h-5 text-sky-400"></i>
        </div>
        <div>
          <h2 id="settings-modal-title" class="text-base font-semibold text-zinc-100">API Access</h2>
          <p class="text-xs text-zinc-400">Generate keys to access DCP Cloud APIs programmatically.</p>
        </div>
      </div>
      <button
        onclick={() => onclose?.()}
        class="text-zinc-500 hover:text-zinc-300 transition-colors p-2 rounded-lg hover:bg-zinc-800"
        aria-label="Close"
      >
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>
    </div>

    <div class="p-6">
      {#if newlyGeneratedKey}
        <!-- SUCCESS STATE -->
        <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 mb-2">
          <div class="flex items-start gap-3">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-400 mt-0.5 shrink-0"></i>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-emerald-100 mb-1">Save your new secret key</h3>
              <p class="text-xs text-emerald-200/70 mb-4">
                Please copy this key and save it somewhere secure. For security reasons,
                <strong>you will not be able to view it again</strong>.
              </p>

              <div class="flex items-center gap-2">
                <code class="flex-1 bg-zinc-950 border border-emerald-500/30 rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono select-all overflow-x-auto">
                  {newlyGeneratedKey}
                </code>
                <button
                  onclick={copyToClipboard}
                  class="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shrink-0"
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
            onclick={resetView}
            class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium px-5 py-2 rounded-lg transition"
          >
            Done
          </button>
        </div>
      {:else}
        <!-- DEFAULT STATE -->

        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-medium text-zinc-200">Secret Keys</h3>
          {#if !isGenerating}
            <button
              onclick={() => (isGenerating = true)}
              class="text-xs bg-zinc-100 hover:bg-white text-zinc-900 font-medium px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm"
            >
              <i data-lucide="plus" class="w-3.5 h-3.5"></i> Create new secret key
            </button>
          {/if}
        </div>

        {#if isGenerating}
          <div class="bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <label for="new-key-name" class="block text-xs font-medium text-zinc-400 mb-2">Name your key</label>
            <div class="flex items-center gap-3">
              <input
                id="new-key-name"
                type="text"
                bind:value={newKeyName}
                placeholder="e.g., Production Backend"
                class="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                onkeydown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={isCreating}
              />
              <button
                onclick={() => { isGenerating = false; newKeyName = ""; createError = null; }}
                disabled={isCreating}
                class="text-sm text-zinc-400 hover:text-zinc-200 px-3 py-2 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onclick={handleGenerate}
                disabled={!newKeyName.trim() || isCreating}
                class="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:hover:bg-sky-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                {#if isCreating}
                  <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Creating…
                {:else}
                  Create Key
                {/if}
              </button>
            </div>
            {#if createError}
              <p class="text-xs text-rose-400 mt-2">{createError}</p>
            {/if}
          </div>
        {/if}

        {#if revokeError}
          <div class="mb-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
            Revoke failed: {revokeError}
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
              {#if isLoading}
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-zinc-500 text-sm">
                    <i data-lucide="loader-2" class="w-4 h-4 inline animate-spin mr-2"></i>
                    Loading keys…
                  </td>
                </tr>
              {:else if loadError}
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-rose-400 text-sm">
                    Failed to load keys: {loadError}
                    <button onclick={loadKeys} class="underline ml-2 hover:text-rose-300">Retry</button>
                  </td>
                </tr>
              {:else if apiKeys.length === 0}
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-zinc-500 text-sm">
                    No API keys generated yet.
                  </td>
                </tr>
              {:else}
                {#each apiKeys as key (key.id)}
                  <tr class="hover:bg-zinc-900/30 transition-colors">
                    <td class="px-4 py-3 text-zinc-200 font-medium">
                      {key.name || "NA"}
                    </td>
                    <td class="px-4 py-3 font-mono text-zinc-400 text-xs">
                      {key.prefix || "—"}••••••••••••
                    </td>
                    <td class="px-4 py-3 text-zinc-500 text-xs">
                      {formatDate(key.createdAt)}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        onclick={() => revokeKey(key.id)}
                        disabled={revokingId === key.id}
                        class="text-zinc-500 hover:text-rose-400 transition p-1.5 rounded hover:bg-rose-500/10 disabled:opacity-50"
                        title="Revoke Key"
                        aria-label="Revoke key"
                      >
                        {#if revokingId === key.id}
                          <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
                        {:else}
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        {/if}
                      </button>
                    </td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  </div>
</div>