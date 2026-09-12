<script lang="ts">
  import { renderWithHighlight } from "../../lib/highlight";

  // block: { type: 'tool', id, description, status: 'running'|'done'|'error', result: any }
  let { block }: { block: any } = $props();

  $effect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
</script>

<div
  class="my-3 border-l-2 pl-3 w-full max-w-2xl transition-all duration-200
         opacity-60 hover:opacity-100
         {block.status === 'error'
           ? 'border-rose-500/50'
           : 'border-zinc-700/60'}"
>
  <!-- Header / Status Bar -->
  <div class="flex items-center gap-2 py-1">
    {#if block.status === 'running'}
      {@html `<i data-lucide="loader-2" class="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0"></i>`}
      <span class="text-xs font-medium text-zinc-300 truncate">{block.description || "Executing tool..."}</span>

    {:else if block.status === 'done'}
      {@html `<i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400 shrink-0"></i>`}
      <span class="text-xs font-medium text-zinc-300 truncate">{block.description || "Execution complete"}</span>
      <!-- <span class="ml-auto text-[10px] text-zinc-500 font-mono shrink-0">{block.id}</span> -->

    {:else if block.status === 'error'}
      {@html `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-rose-400 shrink-0"></i>`}
      <span class="text-xs font-medium text-rose-300">Execution Failed</span>
    {/if}
  </div>

  <!-- Content Payload -->
  {#if block.status === 'done' && block.result}
    {#if typeof block.result === 'object' && block.result.type === 'markdown'}
      <div
        class="prose prose-invert prose-zinc max-w-none py-1 text-sm
               prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-700
               prose-pre:rounded-lg prose-pre:my-2 prose-pre:px-4 prose-pre:py-3
               prose-code:before:content-none prose-code:after:content-none"
        dir="auto"
      >
        {@html renderWithHighlight(block.result.content)}
      </div>

    {:else if typeof block.result === 'object' && block.result.type === 'html'}
      <div class="glassbox-html py-1 text-sm text-zinc-200">
        {@html block.result.content}
      </div>

    {:else if typeof block.result === 'object'}
      <div class="py-1 text-sm text-zinc-200 whitespace-pre-wrap">
        {block.result.content}
      </div>

    {:else}
      <div class="py-1 text-sm text-zinc-200 whitespace-pre-wrap">
        {block.result}
      </div>
    {/if}

  {:else if block.status === 'error' && block.result}
    <div class="py-1 text-xs text-rose-200 font-mono">
      {block.result}
    </div>
  {/if}
</div>