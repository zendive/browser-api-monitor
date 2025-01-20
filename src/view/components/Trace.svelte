<script lang="ts">
  import type { TTrace } from '../../wrapper/traceUtil.ts';
  import TraceLink from './TraceLink.svelte';

  let { trace }: { trace: TTrace[] } = $props();
</script>

{#each trace as { link, name }, index (index)}
  {@const isLast = index === trace.length - 1}
  <TraceLink {link} {name} />
  {#if !isLast}•&nbsp;{/if}
{/each}
