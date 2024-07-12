<script lang="ts">
  import { type TTrace, ETraceDomain } from '@/api/wrappers.ts';
  import TraceLink from '@/view/components/TraceLink.svelte';

  export let trace: TTrace[] = [];
  export let traceDomain: ETraceDomain;
</script>

{#if traceDomain === ETraceDomain.LOCAL}
  <span title="Local domain">🏡</span>
{:else if traceDomain === ETraceDomain.EXTERNAL}
  <span title="External domain">🌍</span>
{:else if traceDomain === ETraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}

{#each trace as stack, index (index)}
  {#if index > 0}&nbsp;•{/if}
  <TraceLink bind:link={stack.link} bind:name={stack.name} />
{/each}
