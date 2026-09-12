<script lang="ts">
  let {
    stages = [
      { at: 0,     label: "Thinking" },
      { at: 3000,  label: "Working through it" },
      { at: 8000,  label: "Almost there" },
      { at: 15000, label: "Still going" },
    ],
  }: { stages?: { at: number; label: string }[] } = $props();

  let elapsed = $state(0);

  $effect(() => {
    const start = Date.now();
    const tick = setInterval(() => {
      elapsed = Date.now() - start;
    }, 250);
    return () => clearInterval(tick);
  });

  // Pick the latest stage whose threshold has passed
  let currentLabel = $derived(
    stages.reduce((acc, s) => (elapsed >= s.at ? s.label : acc), stages[0].label)
  );
</script>

<div class="flex items-center gap-2 py-0.5 text-zinc-400 text-sm transition-opacity duration-300">
  <span class="thinking-label">{currentLabel}</span>
  <span class="inline-flex gap-1 items-end">
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
    <span class="thinking-dot"></span>
  </span>
</div>

<style>
  .thinking-label {
    /* Smooth cross-fade when the label swaps */
    animation: label-fade 300ms ease-out;
  }

  @keyframes label-fade {
    from { opacity: 0; transform: translateY(2px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .thinking-dot {
    width: 4px;
    height: 4px;
    border-radius: 9999px;
    background: currentColor;
    animation: thinking-bounce 1.4s infinite ease-in-out;
  }
  .thinking-dot:nth-child(1) { animation-delay: 0s; }
  .thinking-dot:nth-child(2) { animation-delay: 0.18s; }
  .thinking-dot:nth-child(3) { animation-delay: 0.36s; }

  @keyframes thinking-bounce {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-3px); }
  }

  @media (prefers-reduced-motion: reduce) {
    .thinking-dot { animation: none; opacity: 0.6; }
    .thinking-label { animation: none; }
  }
</style>