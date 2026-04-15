<script lang="ts">
  import {
    ETraceDomain,
    type ITrace,
  } from '../../../wrapper/shared/TraceUtil.ts';
  import TraceLink from './TraceLink.svelte';

  let {
    trace,
    traceDomain,
  }: {
    trace: ITrace[];
    traceDomain: ETraceDomain;
  } = $props();
</script>

{#if traceDomain === ETraceDomain.SAME}
  <span class="icon -small -trace-local" title="Same domain"></span>
{:else if traceDomain === ETraceDomain.EXTERNAL}
  <span class="icon -small -trace-external" title="External domain"></span>
{:else if traceDomain === ETraceDomain.EXTENSION}
  <span class="icon -small -trace-extension" title="Local extension"></span>
{:else if traceDomain === ETraceDomain.SNIPPET}
  <span class="icon -small -trace-extension" title="Local snippet"></span>
{:else if traceDomain === ETraceDomain.WEBPACK}
  <span class="icon -small -trace-webpack" title="Webpack"></span>
{:else if traceDomain === ETraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}

{#each trace as { link, name }, index (index)}
  {#if index !== 0}&nbsp;•{/if}
  <TraceLink {link} {name} />
{/each}
