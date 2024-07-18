<script lang="ts">
  import { type TTrace, ETraceDomain } from '@/api/wrappers.ts';
  import TraceLink from '@/view/components/TraceLink.svelte';

  export let trace: TTrace[] = [];
  export let traceDomain: ETraceDomain;
</script>

{#if traceDomain === ETraceDomain.SAME}
  <span class="icon -small -trace-local" title="Same domain" />
{:else if traceDomain === ETraceDomain.EXTERNAL}
  <span class="icon -small -trace-external" title="External domain" />
{:else if traceDomain === ETraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}

{#each trace as stack, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink bind:link={stack.link} bind:name={stack.name} />
{/each}
