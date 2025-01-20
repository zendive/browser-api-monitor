<script lang="ts">
  import { ETraceDomain } from '../../wrapper/traceUtil.ts';

  let { traceDomain }: { traceDomain: ETraceDomain } = $props();
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
