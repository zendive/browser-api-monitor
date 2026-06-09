<script lang="ts">
  import type { Snippet } from 'svelte';

  let { isExpanded, onClick, class: className = '', children }: {
    isExpanded: boolean;
    onClick: () => void;
    class?: string;
    children?: Snippet;
  } = $props();

  function _onClick(e: MouseEvent) {
    e.preventDefault();
    onClick();
  }
</script>

<a
  href="."
  role="button"
  title={isExpanded ? 'Collapse' : 'Expand'}
  class={className}
  onclick={_onClick}
>
  {#if isExpanded}&#x25A1;{:else}&#x25A0;{/if}
  {@render children?.()}
</a>
