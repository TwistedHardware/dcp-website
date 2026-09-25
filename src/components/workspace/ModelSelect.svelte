<script lang="ts">
  import { Zap, Brain, Microscope, ChevronDown } from "lucide-svelte";
  import type { ModelId } from "../../lib/types/chat";

  let { value, onchange, disabled = false }: {
    value: ModelId;
    onchange: (m: ModelId) => void;
    disabled?: boolean;
  } = $props();

  const MODELS: { id: ModelId; label: string; Icon: any }[] = [
    { id: "fast",          label: "Fast",          Icon: Zap },
    { id: "pro",           label: "Pro",           Icon: Brain },
    { id: "deep-research", label: "Deep Research", Icon: Microscope },
  ];

  let open = $state(false);

  const current = $derived(MODELS.find((m) => m.id === value) ?? MODELS[0]);

  function pick(id: ModelId) {
    open = false;
    if (id !== value) onchange(id);
  }

  function onWindowClick(e: MouseEvent) {
    if (!open) return;
    const t = e.target as HTMLElement;
    if (!t.closest("[data-model-select]")) open = false;
  }
</script>

<svelte:window onclick={onWindowClick} />

<div class="relative" data-model-select>
  <button
    type="button"
    {disabled}
    onclick={() => (open = !open)}
    class="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium
           text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60
           border border-zinc-800 hover:border-zinc-700
           transition disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <svelte:component this={current.Icon} class="w-3.5 h-3.5 text-sky-400" />
    <span>{current.label}</span>
    <ChevronDown class="w-3 h-3 text-zinc-500" />
  </button>

  {#if open}
    <div
      class="absolute bottom-full mb-2 start-0 min-w-[160px] rounded-lg border border-zinc-800
             bg-zinc-900 shadow-xl shadow-black/40 overflow-hidden z-20"
    >
      {#each MODELS as m}
        <button
          type="button"
          onclick={() => pick(m.id)}
          class="w-full flex items-center gap-2 px-3 py-2 text-xs text-start
                 hover:bg-zinc-800 transition
                 {m.id === value ? 'text-sky-400' : 'text-zinc-300'}"
        >
          <svelte:component this={m.Icon} class="w-3.5 h-3.5" />
          <span>{m.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>