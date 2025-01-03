<script lang="ts">
  import { TraceDomain, type TTraceDomain } from '../../api/wrappers.ts';

  let { traceDomain }: { traceDomain: TTraceDomain } = $props();
</script>

{#if traceDomain === TraceDomain.SAME}
  <span class="icon -small -trace-local" title="Same domain"></span>
{:else if traceDomain === TraceDomain.EXTERNAL}
  <span class="icon -small -trace-external" title="External domain"></span>
{:else if traceDomain === TraceDomain.EXTENSION}
  <span class="icon -small -trace-extension" title="Local extension"></span>
{:else if traceDomain === TraceDomain.UNKNOWN}
  <span title="Unknown domain">❓</span>
{/if}
