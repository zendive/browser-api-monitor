<script lang="ts">
  import type { TTrace } from '@/api/wrappers.ts';
  import TraceLink from '@/view/components/TraceLink.svelte';

  export let trace: TTrace[];
</script>

{#each trace as stack, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink bind:link={stack.link} bind:name={stack.name} />
{/each}
