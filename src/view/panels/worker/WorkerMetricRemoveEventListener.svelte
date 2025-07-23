<script lang="ts">
  import {
    type IWorkerTelemetryMetric,
    WorkerRELFacts,
  } from '../../../wrapper/WorkerWrapper.ts';
  import CollapseExpand from './CollapseExpand.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellFacts from '../shared/CellFacts.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.rel.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            removeEventListener [<Variable value={metric.rel.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-c" title="Facts"><span class="icon -facts"></span></th>
        <th class="ta-c">Called</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.rel as rel (rel.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={rel.trace}
              traceDomain={rel.traceDomain}
            />
          </td>
          <td class="ta-c">
            <CellFacts
              facts={rel.facts}
              factsMap={WorkerRELFacts}
            />
          </td>
          <td class="ta-c"><Variable value={rel.calls} /></td>
          <td><CellBypass traceId={rel.traceId} /></td>
          <td><CellBreakpoint traceId={rel.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
