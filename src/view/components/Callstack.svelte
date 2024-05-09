<script lang="ts">
  import type { TCallstack } from '@/api/wrappers.ts';
  import CallstackLink from '@/view/components/CallstackLink.svelte';

  export let trace: TCallstack = [];
</script>

{#each trace as stack, index (index)}
  {#if index > 0}&nbsp;•{/if}
  <CallstackLink bind:href={stack.link} bind:name={stack.name} />
{/each}
