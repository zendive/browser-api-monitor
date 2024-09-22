<script lang="ts">
  import { ETraceDomain, type ETraceDomainKeys } from '@/api/wrappers.ts';

  export let traceDomain: ETraceDomainKeys;
</script>

{#if traceDomain === ETraceDomain.SAME}
  <span class="icon -small -trace-local" title="Same domain" />
{:else if traceDomain === ETraceDomain.EXTERNAL}
  <span class="icon -small -trace-external" title="External domain" />
{:else if traceDomain === ETraceDomain.EXTENSION}
  <span class="icon -small -trace-extension" title="Local extension" />
{:else if traceDomain === ETraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}
