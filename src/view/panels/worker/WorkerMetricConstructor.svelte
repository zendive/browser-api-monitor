<script lang="ts">
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import type { IWorkerTelemetryMetric } from '../../../wrapper/WorkerWrapper.js';
  import CollapseExpand from './CollapseExpand.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.konstruktor.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            constructor [<Variable value={metric.konstruktor.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-c">Called</th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.konstruktor as konstruktor (konstruktor.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={konstruktor.trace}
              traceDomain={konstruktor.traceDomain}
            />
          </td>
          <td class="ta-c"><Variable value={konstruktor.calls} /></td>
          <td><CellBreakpoint traceId={konstruktor.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
