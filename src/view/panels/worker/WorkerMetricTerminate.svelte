<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.ts';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CollapseExpand from './CollapseExpand.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.terminate.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            terminate [<Variable value={metric.terminate.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-c">Called</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.terminate as terminate (terminate.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={terminate.trace}
              traceDomain={terminate.traceDomain}
            />
          </td>
          <td class="ta-c"><Variable value={terminate.calls} /></td>
          <td><CellBypass traceId={terminate.traceId} /></td>
          <td><CellBreakpoint traceId={terminate.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
