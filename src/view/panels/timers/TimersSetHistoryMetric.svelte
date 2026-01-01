<script lang="ts">
  import {
    SetTimerFacts,
    type TSetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellCancelable from '../shared/CellCancelable.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import {
    delayTooltip,
    type TFindRegressorCallback,
  } from '../../shared/util.ts';

  let {
    metric,
    onFindRegressors,
  }: {
    metric: TSetTimerHistory;
    onFindRegressors: TFindRegressorCallback;
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
    <CellCancelable
      calls={metric.calls}
      canceledCounter={metric.canceledCounter}
      canceledByTraceIds={metric.canceledByTraceIds}
      onClick={onFindRegressors}
    />
  </td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
  <td class="ta-r">
    {#if metric.online}
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
