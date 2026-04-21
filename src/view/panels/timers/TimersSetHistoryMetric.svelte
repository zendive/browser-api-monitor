<script lang="ts">
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellOnline from './CellOnline.svelte';
  import CellTerminatableCalls from '../shared/CellTerminatableCalls.svelte';
  import {
    type ISetTimerHistory,
    SetTimerFacts,
  } from '../../../wrapper/TimerWrapper.ts';
  import { delayTooltip } from '../../shared/util.ts';

  let {
    metric,
    popoverId,
    showTerminatorsFor,
  }: {
    metric: ISetTimerHistory;
    popoverId: string;
    showTerminatorsFor: (traceId: string) => void;
  } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-r">
    <CellSelfTime time={metric.selfTime} />
  </td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={SetTimerFacts} />
  </td>
  <td class="ta-c">
    <CellTerminatableCalls
      calls={metric.calls}
      canceledCounter={metric.canceledCounter}
      canceledByTraceIds={metric.canceledByTraceIds}
      {popoverId}
      eventClick={() => void showTerminatorsFor(metric.traceId)}
    />
  </td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
  <td class="ta-r">
    {#if metric.online}
      <CellOnline traceId={metric.traceId} online={metric.online} />
    {/if}
  </td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
