<script lang="ts">
  import { tick } from "svelte";
  import InputArea from "./InputArea.svelte";
  import MessageRow from "./MessageRow.svelte";

  let {
    lang = "en",
    i18n = {},
    isSecretMode = false,
    sessionId,
  }: {
    lang?: string;
    i18n?: Record<string, string>;
    isSecretMode?: boolean;
    sessionId: string;
  } = $props();

  let messages = $state<any[]>([]);
  let isStreaming = $state(false);
  let scrollContainer: HTMLElement | undefined = $state();

  let shouldStickToBottom = $state(true);
  let scrollQueued = false;

  // Remember the last user prompt so retry can re-run it
  let lastUserText = $state<string | null>(null);

  function handleScroll() {
    if (!scrollContainer) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    shouldStickToBottom = scrollHeight - scrollTop - clientHeight < 80;
  }

  function scrollToBottom() {
    if (!shouldStickToBottom) return;
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      if (!scrollContainer) return;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    });
  }

  // Refresh Lucide icons after any DOM change that could add them
  $effect(() => {
    messages.length;
    messages.forEach((m) => {
      m.blocks.length;
      m.suggestions?.length;
    });
    tick().then(() => window.lucide?.createIcons());
  });

  // Public entry point — from the input
  async function sendMessage(text: string) {
    if (!text) return;

    messages.push({
      role: "user",
      blocks: [{ type: "text", content: text }],
    });
    lastUserText = text;

    await streamAssistantReply(text);
  }

  // Public entry point — from the "Try again" button on an errored message
  async function retryLast() {
    if (!lastUserText) return;

    // Remove the errored assistant message (the last one)
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last?.status === "error") {
      messages.pop();
    }

    await streamAssistantReply(lastUserText);
  }

  // The workhorse — pushes the assistant message and consumes the SSE stream
  async function streamAssistantReply(text: string) {
    // Push the assistant message we'll stream into
    const assistantMsg = {
      role: "assistant",
      blocks: [],
      suggestions: [],
      status: "streaming" as "streaming" | "done" | "error",
    };
    messages.push(assistantMsg);

    isStreaming = true;
    shouldStickToBottom = true;

    const token = localStorage.getItem("token");
    const publicKey = localStorage.getItem("public_key");

    try {
      const response = await fetch("https://api.dcp.tc-sa.com/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-publickey-hex": publicKey || "",
        },
        body: JSON.stringify({ sessionId, model: "fast", message: text }),
      });

      if (response.status === 401) {
        window.location.href = `/${lang}/`;
        return;
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let currentEventType: string | null = null;

      // The assistant message we're streaming into
      const msg = messages[messages.length - 1];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          if (line.startsWith("event: ")) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (dataStr === "[DONE]") {
              currentEventType = null;
              continue;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const eventType = currentEventType || parsed.type || null;
              currentEventType = null;

              switch (eventType) {
                case "content": {
                  const lastBlock = msg.blocks[msg.blocks.length - 1];
                  if (lastBlock && lastBlock.type === "text") {
                    lastBlock.content += parsed.content;
                  } else {
                    msg.blocks.push({ type: "text", content: parsed.content });
                  }
                  scrollToBottom();
                  break;
                }

                case "tool_notification": {
                  const id = parsed.content.id;
                  // Guard against duplicate notifications
                  const exists = msg.blocks.find(
                    (b: any) => b.type === "tool" && b.id === id
                  );
                  if (!exists) {
                    msg.blocks.push({
                      type: "tool",
                      id,
                      description: parsed.content.value,
                      status: "running",
                    });
                  }
                  scrollToBottom();
                  break;
                }

                case "tool_done": {
                  const block = msg.blocks.find(
                    (b: any) => b.id === parsed.content.id
                  );
                  if (block) {
                    block.status = "done";
                    block.result = parsed.content.value;
                  }
                  scrollToBottom();
                  break;
                }

                case "tool_error": {
                  const block = msg.blocks.find(
                    (b: any) => b.id === parsed.content.id
                  );
                  if (block) {
                    block.status = "error";
                    block.result = parsed.content.value;
                  }
                  scrollToBottom();
                  break;
                }

                case "suggestions":
                  msg.suggestions = parsed.content;
                  await tick();
                  window.lucide?.createIcons();
                  scrollToBottom();
                  break;

                case "done":
                  msg.status = "done";
                  break;

                case "error": {
                  // Mark any still-running tool calls as errored
                  for (const b of msg.blocks) {
                    if (b.type === "tool" && b.status === "running") {
                      b.status = "error";
                      b.result = { content: "Cancelled due to error", type: "text" };
                    }
                  }

                  // Push a distinct error block
                  msg.blocks.push({
                    type: "error",
                    content: parsed.error || "Something went wrong.",
                  });

                  msg.status = "error";
                  scrollToBottom();
                  reader.cancel();
                  return; // exit streamAssistantReply
                }
              }
            } catch {
              console.warn("Failed to parse chunk:", dataStr);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      const msg = messages[messages.length - 1];
      const errorMessage = err instanceof Error ? err.message : String(err);
      msg.blocks.push({
        type: "error",
        content: errorMessage,
      });
      msg.status = "error";
    } finally {
      isStreaming = false;
    }
  }

  // Kept for compatibility with the suggestion-chip click handler
  async function handleSubmit(text: string) {
    await sendMessage(text);
  }
</script>

<!-- The Main Chat Viewport -->
<div class="flex flex-col flex-1 min-h-0">
  <main
    bind:this={scrollContainer}
    onscroll={handleScroll}
    class="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-6 pb-6 w-full flex flex-col items-center"
  >
    <div class="w-full max-w-3xl space-y-6">
      {#if messages.length === 0}
        <div class="text-center py-12 px-4 rounded-2xl bg-gradient-to-b from-zinc-900/40 to-zinc-900/0 border border-zinc-800/50 mt-6">
          <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-4">
            <i data-lucide={isSecretMode ? "shield" : "sparkles"} class="w-6 h-6"></i>
          </div>
          <h3 class="text-base font-medium text-zinc-200">
            {isSecretMode ? "Zero-Knowledge Mode" : (i18n.welcomeTitle || "Secure Execution Environment")}
          </h3>
          <p class="text-xs text-zinc-400 max-w-md mx-auto mt-1">
            {isSecretMode ? "This session will self-destruct. Logs are ephemeral." : (i18n.welcomeDesc || "Hardware-tethered and end-to-end encrypted.")}
          </p>
        </div>
      {/if}

      {#each messages as msg}
        <MessageRow
          {msg}
          onsuggestionClick={(p) => sendMessage(p)}
          onretry={retryLast}
        />
      {/each}
    </div>
  </main>

  <div class="shrink-0 w-full">
    <InputArea
      disabled={isStreaming}
      on:submit={(e) => sendMessage(e.detail.text)}
      placeholder={i18n.placeholder}
      shiftEnterText={i18n.shiftEnter}
      tokenContextText={isSecretMode ? "ZKS Active - Ephemeral Memory" : i18n.tokenContext}
    />
  </div>
</div>