<script lang="ts">
	import { onMount } from "svelte";
	import Sidebar from "./Sidebar.svelte";
	import Header from "./Header.svelte";
	import ChatCanvas from "./ChatCanvas.svelte";
	import SettingsModal from "./SettingsModal.svelte";

	export let lang: string = "en";
	export let i18n: Record<string, string> = {};

	let isSidebarOpen = false;
	let isSecretMode = false;
	let isSettingsOpen = false;

	// Session state
	let currentSessionId: string = crypto.randomUUID();
	let sessions = [
		{ id: "s-101", title: "ZATCA Compliance Pipeline", timestamp: "10m ago" },
		{ id: "s-102", title: "Audit Log Reconciliation", timestamp: "2h ago" },
		{
			id: "s-103",
			title: "Huawei CANN Kernel Benchmarks",
			timestamp: "Yesterday",
		},
	];

	onMount(() => {
    // 1. Check screen width: open on desktop, keep closed on mobile
    if (window.innerWidth >= 768) {
      isSidebarOpen = true;
    }

    // Auth guard...
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("token_expiry");

    const isExpired = () => {
      if (!token || !expiry) return true;
      const expiryTime = !isNaN(Number(expiry))
        ? String(expiry).length === 10
          ? Number(expiry) * 1000
          : Number(expiry)
        : new Date(expiry).getTime();
      return Date.now() > expiryTime;
    };

    if (isExpired()) {
      window.location.href = `/${lang}/`;
    }
  });

	function handleNewSession() {
		isSecretMode = false;
		currentSessionId = crypto.randomUUID();
		console.log("New session with id", currentSessionId);
	}

	function handleStartSecret() {
		isSecretMode = true;
		currentSessionId = crypto.randomUUID();
	}

	function handleSelectSession({ id }: { id: string }) {
    isSecretMode = false;
    currentSessionId = id;
  }
</script>

<div
	class="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans"
>
	<!-- Left Control Sidebar -->
	<Sidebar
		{sessions}
		{isSecretMode}
		isOpen={isSidebarOpen}
		onNewSession={handleNewSession}
		onStartSecret={handleStartSecret}
		onSelectSession={handleSelectSession}
		onOpenSettings={() => (isSettingsOpen = true)}
	/>

	<!-- Right Execution Canvas Area -->
	<div class="flex flex-col flex-1 h-full min-w-0 bg-zinc-900/40 relative">
		<!-- Top Bar -->
		<Header
			{lang}
			{i18n}
			{isSecretMode}
			bind:isSidebarOpen
			onresetSession={handleNewSession}
		/>

		<!-- Main Interactive Area -->
		{#key currentSessionId}
			<ChatCanvas {lang} {i18n} {isSecretMode} sessionId={currentSessionId} />
		{/key}
	</div>
</div>

<!-- Integration & API Key Vault Modal -->
{#if isSettingsOpen}
  <SettingsModal {lang} onclose={() => (isSettingsOpen = false)} />
{/if}
