<script lang="ts">
  import type { TClearTimerHistory } from '@/api/wrappers.ts';
  import Trace from '@/view/components/Trace.svelte';
  import TraceDomain from '@/view/components/TraceDomain.svelte';
  import Variable from '@/view/components/Variable.svelte';

  export let metric: TClearTimerHistory;
</script>

<tr class="t-zebra" class:bc-error={metric.hasError}>
  <td><TraceDomain bind:traceDomain={metric.traceDomain} /></td>
  <td class="wb-all">
    <Trace bind:trace={metric.trace} bind:traceId={metric.traceId} />
  </td>
  <td class="ta-c">
    <Variable bind:value={metric.calls} />
  </td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r">{metric.delay}</td>
</tr>
