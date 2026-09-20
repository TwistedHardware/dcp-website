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

  // Session model contract matching backend ChatSession
  interface ChatSessionItem {
    sessionId: string;
    title: string;
    createdAt?: string;
    lastUpdate?: string;
    isGeneratingTitle?: boolean;
  }

  // Session state
  let currentSessionId: string = crypto.randomUUID();
  let sessions: ChatSessionItem[] = [];

  onMount(async () => {
    // 1. Screen check
    if (window.innerWidth >= 768) {
      isSidebarOpen = true;
    }

    // 2. Auth guard
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

    // 3. Load initial sessions from backend
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
        // Filter out secret sessions from sidebar history
        sessions = data.result.filter((s: any) => !s.isSecret);
      }
    } catch (err) {
      console.error("Failed to load session list:", err);
    }
  }

  function handleNewSession() {
    isSecretMode = false;
    currentSessionId = crypto.randomUUID();
  }

  function handleStartSecret() {
    isSecretMode = true;
    currentSessionId = crypto.randomUUID();
  }

  function handleSelectSession({ id }: { id: string }) {
    if (currentSessionId === id) return;
    isSecretMode = false;
    currentSessionId = id;
  }

  // 1. Triggered on first user message: prepend session with loading state
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

  // 2. Triggered on SSE { type: "title" }: replace animation with title
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

    <!-- Main Interactive Area: remounts cleanly on session switch -->
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
  </div>
</div>

<!-- Integration & API Key Vault Modal -->
{#if isSettingsOpen}
  <SettingsModal {lang} onclose={() => (isSettingsOpen = false)} />
{/if}