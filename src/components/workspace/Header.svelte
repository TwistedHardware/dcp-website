<script lang="ts">
	let {
		lang = "en",
		i18n = {},
		isSecretMode = false,
		isSidebarOpen = $bindable(true),
		onresetSession,
	}: {
		lang?: string;
		i18n?: Record<string, string>;
		isSecretMode?: boolean;
		isSidebarOpen?: boolean;
		onresetSession?: () => void;
	} = $props();

	$effect(() => {
		// Track the state that changes which icons render
		void isSecretMode;
		void isSidebarOpen;
		// Re-run Lucide after Svelte flushes the DOM
		queueMicrotask(() => window.lucide?.createIcons());
	});
</script>

<header
	class="h-16 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md flex-none px-4 sm:px-6 flex items-center justify-between z-10"
>
	<div class="flex items-center gap-3">
		<!-- Sidebar Toggle (Mobile / Space saving) -->
		<button
			onclick={() => (isSidebarOpen = !isSidebarOpen)}
			aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
			title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
			class="p-2 -ml-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition"
		>
			<i data-lucide="menu" class="w-5 h-5"></i>
		</button>

		<div class="flex items-center gap-3 ml-2">
			<h1 class="font-semibold text-sm tracking-tight text-zinc-200">
				{#if isSecretMode}
					Hardware-Tethered Session
				{:else}
					{i18n.headerTitle || "Secure Workspace"}
				{/if}
			</h1>

			<!-- Telemetry Pill -->
			{#if isSecretMode}
				<span
					class="bg-indigo-500/10 text-indigo-400 text-[10px] font-medium px-2.5 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
				>
					<i data-lucide="key" class="w-3 h-3"></i> ZKS Active
				</span>
			{:else}
				<span
					class="bg-emerald-500/10 text-emerald-400 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1"
				>
					<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
					></span> Active
				</span>
			{/if}
		</div>
	</div>

	<div class="flex items-center gap-3">
		<div
			class="hidden sm:flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs text-zinc-400"
		>
			{#if isSecretMode}
				<i data-lucide="shield-check" class="w-3.5 h-3.5 text-indigo-400"></i>
				<span>Ephemeral Memory</span>
			{:else}
				<i data-lucide="hard-drive" class="w-3.5 h-3.5 text-sky-400"></i>
				<span>{i18n.cacheStatus || "Local Context Encrypted"}</span>
			{/if}
		</div>

		<button
			onclick={() => onresetSession?.()}
			class="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-rose-400 rounded-lg transition"
			title={i18n.reset || "Purge Session"}
		>
			<i data-lucide="rotate-ccw" class="w-4 h-4"></i>
		</button>
	</div>
</header>
