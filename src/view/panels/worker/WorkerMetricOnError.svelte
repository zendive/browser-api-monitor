<script lang="ts">
  import CellBypass from '../shared/CellBypass.svelte';
  import CellFrameTimeSensitive from '../shared/CellFrameTimeSensitive.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import CollapseExpand from './CollapseExpand.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.onerror.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            set onerror [<Variable value={metric.onerror.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-r">Self</th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">Events</th>
        <th class="ta-c">Called</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.onerror as onerror (onerror.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={onerror.trace}
              traceDomain={onerror.traceDomain}
            />
          </td>
          <td class="ta-r">
            <CellFrameTimeSensitive value={onerror.eventSelfTime} />
          </td>
          <td class="ta-c">{onerror.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={onerror.events} /></td>
          <td class="ta-c"><Variable value={onerror.calls} /></td>
          <td><CellBypass traceId={onerror.traceId} /></td>
          <td><CellBreakpoint traceId={onerror.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
