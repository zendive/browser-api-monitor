<script lang="ts">
  import { ETraceDomain, type TTrace } from '../../../wrapper/TraceUtil.ts';
  import TraceLink from './TraceLink.svelte';

  let {
    trace,
    traceDomain,
  }: {
    trace: TTrace[];
    traceDomain: ETraceDomain;
  } = $props();
</script>

{#if traceDomain === ETraceDomain.SAME}
  <span class="icon -small -trace-local" title="Same domain"></span>
{:else if traceDomain === ETraceDomain.EXTERNAL}
  <span class="icon -small -trace-external" title="External domain"></span>
{:else if traceDomain === ETraceDomain.EXTENSION}
  <span class="icon -small -trace-extension" title="Local extension"></span>
{:else if traceDomain === ETraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}

{#each trace as { link, name }, index (index)}
  {@const isLast = index === trace.length - 1}
  <TraceLink {link} {name} />
  {#if !isLast}•&nbsp;{/if}
{/each}
