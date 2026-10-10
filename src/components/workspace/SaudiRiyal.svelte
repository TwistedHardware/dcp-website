<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    bold?: boolean;
    font?: 'custom' | 'parent';
    class?: string;
  }

  let {
    bold = false,
    font = 'custom',
    class: className = '',
    ...rest
  }: Props = $props();
</script>

<span 
  class={[
    'sar-symbol', 
    font === 'custom' && 'use-custom-font', 
    bold && 'is-bold', 
    className
  ].filter(Boolean).join(' ')}
  {...rest}
>&#x20C1;</span>

<style>
  .sar-symbol {
    display: inline-block;
  }

  .use-custom-font {
    font-family: 'SaudiRiyalSymbol', sans-serif;
  }

  .is-bold {
    font-weight: 700;
  }
</style>