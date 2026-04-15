<script lang="ts">
  import {
    CafFacts,
    type ICancelAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';

  let { metric }: { metric: ICancelAnimationFrameHistory } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={CafFacts} />
  </td>
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c">{metric.handler}</td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
