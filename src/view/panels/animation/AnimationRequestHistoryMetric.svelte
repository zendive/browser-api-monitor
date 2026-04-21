<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellTerminatableCalls from '../shared/CellTerminatableCalls.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import type { IRequestAnimationFrameHistory } from '../../../wrapper/AnimationWrapper.ts';

  let {
    metric,
    popoverId,
    showTerminatorsFor,
  }: {
    metric: IRequestAnimationFrameHistory;
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
  <td class="ta-r"><CellSelfTime time={metric.selfTime} /></td>
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
  <td class="ta-r">
    {#if metric.online}
      <Variable value={metric.online} />
    {/if}
  </td>
  <td><CellBypass traceId={metric.traceId} /></td>
  <td><CellBreakpoint traceId={metric.traceId} /></td>
</tr>
