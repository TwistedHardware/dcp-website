<script lang="ts">
  import { onMount } from "svelte";
  import Sidebar from "./Sidebar.svelte";
  import Header from "./Header.svelte";
  import ChatCanvas from "./ChatCanvas.svelte";
  import SettingsModal from "./SettingsModal.svelte";
  import MaaSPage from "./maas/MaaSPage.svelte"; 

  let {
    lang = "en",
    i18n = {}
  }: {
    lang?: string;
    i18n?: Record<string, string>;
  } = $props();

  let isSidebarOpen = $state(false);
  let isSecretMode = $state(false);
  let isSettingsOpen = $state(false);
  
  let activeView = $state<'chat' | 'maas'>('chat');

  interface ChatSessionItem {
    sessionId: string;
    title: string;
    createdAt?: string;
    lastUpdate?: string;
    isGeneratingTitle?: boolean;
  }

  let currentSessionId = $state<string>(crypto.randomUUID());
  let sessions = $state<ChatSessionItem[]>([]);

  onMount(async () => {
    if (window.innerWidth >= 768) {
      isSidebarOpen = true;
    }

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
      return;
    }

    await fetchSessions();
  });

  async function fetchSessions() {
    const token = localStorage.getItem("token");
    const subject = localStorage.getItem("subject");

    try {
      const res = await fetch("https://api.dcp.tc-sa.com/api/v1/sessions", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-subject": subject || "",
        },
      });

      if (res.status === 401) {
        window.location.href = `/${lang}/`;
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (data.status === "ok" && Array.isArray(data.result)) {
        sessions = data.result.filter((s: any) => !s.isSecret);
      }
    } catch (err) {
      console.error("Failed to load session list:", err);
    }
  }

  function handleNewSession() {
    activeView = 'chat';
    isSecretMode = false;
    currentSessionId = crypto.randomUUID();
  }

  function handleStartSecret() {
    activeView = 'chat'; 
    isSecretMode = true;
    currentSessionId = crypto.randomUUID();
  }

  function handleSelectSession({ id }: { id: string }) {
    if (currentSessionId === id) return;
    activeView = 'chat';
    isSecretMode = false;
    currentSessionId = id;
  }

  function handleNavigateToMaaS() {
    activeView = 'maas';
  }

  function handleChatStarted({ sessionId }: { sessionId: string }) {
    if (isSecretMode) return;

    const exists = sessions.some((s) => s.sessionId === sessionId);
    if (!exists) {
      const now = new Date().toISOString();
      const placeholder: ChatSessionItem = {
        sessionId,
        title: "",
        createdAt: now,
        lastUpdate: now,
        isGeneratingTitle: true,
      };
      sessions = [placeholder, ...sessions];
    }
  }

  function handleTitleReceived({ sessionId, title }: { sessionId: string; title: string }) {
    sessions = sessions.map((s) => {
      if (s.sessionId === sessionId) {
        return {
          ...s,
          title,
          isGeneratingTitle: false,
          lastUpdate: new Date().toISOString(),
        };
      }
      return s;
    });
  }

  $effect(() => {
    void currentSessionId;
    void activeView; 
    
    setTimeout(() => {
      if (typeof window !== "undefined" && window.lucide) {
        window.lucide.createIcons();
      }
    }, 10);
  });
</script>

<div class="flex h-screen w-full bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
  <!-- Left Control Sidebar -->
  <Sidebar
    {sessions}
    activeSessionId={currentSessionId}
    {isSecretMode}
    bind:isOpen={isSidebarOpen}
    onNewSession={handleNewSession}
    onStartSecret={handleStartSecret}
    onSelectSession={handleSelectSession}
    onOpenSettings={() => (isSettingsOpen = true)}
    onNavigateToMaaS={handleNavigateToMaaS} 
  />

  <!-- Right Execution Canvas Area -->
  <div class="flex flex-col flex-1 h-full min-w-0 bg-zinc-900/40 relative overflow-hidden">
    
    <!-- Top Bar is now unconditionally rendered -->
    <Header
			{lang}
			{i18n}
			{isSecretMode}
			bind:isSidebarOpen
			{activeView} 
			onresetSession={handleNewSession}
		/>

    <!-- Dynamic Content Area -->
    <div class="flex flex-col flex-1 min-h-0 relative">
      {#if activeView === 'chat'}
        {#key currentSessionId}
          <ChatCanvas
            {lang}
            {i18n}
            {isSecretMode}
            sessionId={currentSessionId}
            onChatStarted={handleChatStarted}
            onTitleReceived={handleTitleReceived}
          />
        {/key}
      {:else}
        <!-- Added a wrapper with overflow-y-auto to handle scrolling for the MaaS page -->
        <div class="flex-1 overflow-y-auto w-full h-full">
          <MaaSPage />
        </div>
      {/if}
    </div>
  </div>
</div>

{#if isSettingsOpen}
  <SettingsModal {lang} onclose={() => (isSettingsOpen = false)} />
{/if}