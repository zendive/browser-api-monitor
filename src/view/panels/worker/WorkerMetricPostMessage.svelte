<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CollapseExpand from './CollapseExpand.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.postMessage.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            postMessage [<Variable value={metric.postMessage.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-c">Self</th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">Called</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.postMessage as postMessage (postMessage.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={postMessage.trace}
              traceDomain={postMessage.traceDomain}
            />
          </td>
          <td class="ta-r"><CellSelfTime time={postMessage.selfTime} /></td>
          <td class="ta-c">{postMessage.cps || undefined}</td>
          <td class="ta-c"><Variable value={postMessage.calls} /></td>
          <td><CellBypass traceId={postMessage.traceId} /></td>
          <td><CellBreakpoint traceId={postMessage.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
