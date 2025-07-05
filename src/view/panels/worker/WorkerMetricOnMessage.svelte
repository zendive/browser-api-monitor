<script lang="ts">
  import CollapseExpand from './CollapseExpand.svelte';
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellFrameTimeSensitive from '../shared/CellFrameTimeSensitive.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.onmessage.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            set onmessage [<Variable value={metric.onmessage.length} />]
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
      {#each metric.onmessage as onmessage (onmessage.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={onmessage.trace}
              traceDomain={onmessage.traceDomain}
            />
          </td>
          <td class="ta-r">
            <CellFrameTimeSensitive value={onmessage.eventSelfTime} />
          </td>
          <td class="ta-c">{onmessage.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={onmessage.events} /></td>
          <td class="ta-c"><Variable value={onmessage.calls} /></td>
          <td><CellBypass traceId={onmessage.traceId} /></td>
          <td><CellBreakpoint traceId={onmessage.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
