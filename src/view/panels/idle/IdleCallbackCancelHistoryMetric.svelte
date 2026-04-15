<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import {
    CicFacts,
    type ICancelIdleCallbackHistory,
  } from '../../../wrapper/IdleWrapper.ts';

  let { metric }: { metric: ICancelIdleCallbackHistory } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={CicFacts} />
  </td>
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c">{metric.handler}</td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
