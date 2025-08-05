<script lang="ts">
  import {
    type IWorkerTelemetryMetric,
    WorkerAELFacts,
  } from '../../../wrapper/WorkerWrapper.ts';
  import CollapseExpand from './CollapseExpand.svelte';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellFacts from '../shared/CellFacts.svelte';

  let { metric }: { metric: IWorkerTelemetryMetric } = $props();
  let isExpanded = $state(true);
</script>

{#if metric.ael.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          >
            addEventListener [<Variable value={metric.ael.length} />]
          </CollapseExpand>
        </th>
        <th class="ta-c">Self</th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">Events</th>
        <th class="ta-c" title="Facts"><span class="icon -facts"></span></th>
        <th class="ta-c">Called</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each metric.ael as ael (ael.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={ael.trace}
              traceDomain={ael.traceDomain}
            />
          </td>
          <td class="ta-r">
            <CellSelfTime time={ael.eventSelfTime} />
          </td>
          <td class="ta-c">{ael.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={ael.events} /></td>
          <td class="ta-c">
            <CellFacts
              facts={ael.facts}
              factsMap={WorkerAELFacts}
            />
          </td>
          <td class="ta-c" title="&lt;called&gt; [&lt;removed&gt;]">
            <Variable value={ael.calls} />
            {#if ael.canceledCounter}
              [<Variable value={ael.canceledCounter} />]
            {/if}
          </td>
          <td><CellBypass traceId={ael.traceId} /></td>
          <td><CellBreakpoint traceId={ael.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
