<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellTerminatableCalls from '../shared/CellTerminatableCalls.svelte';
  import {
    type IRequestIdleCallbackHistory,
    RicFacts,
  } from '../../../wrapper/IdleWrapper.ts';
  import { delayTooltip } from '../../shared/util.ts';

  let {
    metric,
    popoverId,
    showTerminatorsFor,
  }: {
    metric: IRequestIdleCallbackHistory;
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
  <td class="ta-c">{metric.didTimeout}</td>
  <td class="ta-r"><CellSelfTime time={metric.selfTime} /></td>
  <td class="ta-c">
    <CellFacts facts={metric.facts} factsMap={RicFacts} />
  </td>
  <td class="ta-c">{metric.cps || undefined}</td>
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
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
