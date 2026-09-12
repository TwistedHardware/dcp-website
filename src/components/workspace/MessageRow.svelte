<script lang="ts">
  import GlassBox from "./GlassBox.svelte";
  import ThinkingIndicator from "./ThinkingIndicator.svelte";
  import { renderWithHighlight } from "../../lib/highlight";
  import { Copy, Check } from "lucide-svelte";

  let {
    msg,
    onsuggestionClick,
    onretry,
  }: {
    msg: any;
    onsuggestionClick?: (prompt: string) => void;
    onretry?: () => void;
  } = $props();

  // Which block is currently being streamed? Only the last text block
  // of a streaming message gets the caret.
  let isStreaming = $derived(msg.status === "streaming");

  let lastTextBlockIndex = $derived(
    msg.blocks.reduce(
      (acc: number, b: any, i: number) => (b.type === "text" ? i : acc),
      -1
    )
  );

  // Copy button state
  let copied = $state(false);

  async function copyMessage() {
    const text = msg.blocks
      .filter((b: any) => b.type === "text")
      .map((b: any) => b.content)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  }

  let lastBlock = $derived(msg.blocks[msg.blocks.length - 1]);

  let isProducingText = $derived(
    msg.status === "streaming" && lastBlock?.type === "text"
  );

  let showThinking = $derived(
    msg.status === "streaming" && !isProducingText
  );

  let thinkingLabel = $derived(
    msg.blocks.some((b: any) => b.type === "tool")
      ? "Reading results"
      : "Thinking"
  );
</script>

<div class={`flex w-full mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
  {#if msg.role === 'user'}
    <div class="max-w-[80%] rounded-2xl px-4 py-3 bg-sky-600 text-white text-sm shadow-md leading-relaxed whitespace-pre-wrap">
      {msg.blocks[0].content}
    </div>

  {:else}
    <div class="w-full max-w-3xl text-zinc-200 text-sm leading-relaxed">

      {#if showThinking}
        <ThinkingIndicator />
      {/if}

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {#each msg.blocks as block, i}
          {#if block.type === 'tool'}
            <div class="col-span-1">
              <GlassBox {block} />
            </div>

          {:else if block.type === 'text'}
            <div
              class="col-span-2 prose prose-invert prose-zinc max-w-none relative
                     prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700
                     prose-pre:rounded-lg prose-pre:my-4 prose-pre:px-4 prose-pre:py-4
                     prose-code:before:content-none prose-code:after:content-none
                     empty:hidden"
              dir="auto"
            >
              {@html renderWithHighlight(block.content, isStreaming && i === lastTextBlockIndex)}
              {#if isStreaming && i === lastTextBlockIndex}
                <span class="streaming-caret"></span>
              {/if}
            </div>

          {:else if block.type === 'error'}
            <div class="col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5
                        flex items-start gap-2.5 text-sm">
              <i data-lucide="alert-circle" class="w-4 h-4 text-rose-400 shrink-0 mt-0.5"></i>
              <div class="flex-1 min-w-0">
                <div class="text-rose-200">{block.content}</div>
                {#if onretry}
                  <button
                    onclick={() => onretry?.()}
                    class="mt-2 inline-flex items-center gap-1.5 text-xs
                           text-rose-300 hover:text-rose-100 transition"
                  >
                    <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                    <span>Try again</span>
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      </div>

      {#if msg.suggestions && msg.suggestions.length > 0}
        <div class="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-800/60">
          {#each msg.suggestions as chip}
            <button
              onclick={() => onsuggestionClick?.(chip.prompt)}
              class="text-xs bg-zinc-800/80 hover:bg-sky-600/20 hover:border-sky-500/50 text-zinc-300 hover:text-sky-300 border border-zinc-700/60 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm text-left"
            >
              <i data-lucide="sparkles" class="w-3 h-3 text-sky-400 shrink-0"></i>
              <span>{chip.label}</span>
            </button>
          {/each}
        </div>
      {/if}

      {#if msg.status === "done"}
        <div class="mt-3 flex items-center gap-1 text-xs text-zinc-500">
          <button
            onclick={copyMessage}
            aria-label="Copy response"
            class="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-zinc-800/60 hover:text-zinc-300 transition"
          >
            {#if copied}
              <Check class="w-3.5 h-3.5 text-emerald-400" />
              <span class="text-emerald-400">Copied</span>
            {:else}
              <Copy class="w-3.5 h-3.5" />
              <span>Copy</span>
            {/if}
          </button>
        </div>
      {/if}

    </div>
  {/if}
</div>

<style>
  .streaming-caret {
    display: inline-block;
    width: 2px;
    height: 1em;
    background: currentColor;
    vertical-align: text-bottom;
    margin-left: 2px;
    animation: caret-pulse 1.5s ease-in-out infinite;
  }

  @keyframes caret-pulse {
    0%, 100% { opacity: 1; }
    50%      { opacity: 0.2; }
  }

  @media (prefers-reduced-motion: reduce) {
    .streaming-caret { animation: none; opacity: 0.6; }
  }
</style>