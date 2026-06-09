<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellTerminatableCalls from '../shared/CellTerminatableCalls.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import type { IRequestAnimationFrameHistory } from '../../../wrapper/AnimationWrapper.ts';
  import type { TTerminatorsPopoverHelper } from '../shared/TerminatorPopoverHelper.svelte.ts';

  let {
    metric,
    popoverId,
    tph,
  }: {
    metric: IRequestAnimationFrameHistory;
    popoverId: string;
    tph: TTerminatorsPopoverHelper;
  } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <CellCallstack trace={metric.trace} />
  </td>
  <td class="ta-r"><CellSelfTime time={metric.selfTime} /></td>
  <td class="ta-c">{metric.cps || undefined}</td>
  <td class="ta-c">
    <CellTerminatableCalls
      calls={metric.calls}
      canceledCounter={metric.canceledCounter}
      canceledByTraceIds={metric.canceledByTraceIds}
      {popoverId}
      eventClick={(e: Event) => void tph.update(metric.traceId, e.currentTarget)}
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
