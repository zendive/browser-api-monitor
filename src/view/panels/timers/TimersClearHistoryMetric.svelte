<script lang="ts">
  import {
    ClearTimerFacts,
    type IClearTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { delayTooltip } from '../../shared/util.ts';

  let { metric }: { metric: IClearTimerHistory } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack trace={metric.trace} />
  </td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={ClearTimerFacts} />
  </td>
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
