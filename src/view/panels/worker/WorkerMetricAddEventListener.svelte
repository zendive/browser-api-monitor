<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import {
    type IWorkerAelMetric,
    WorkerAelFacts,
  } from '../../../wrapper/WorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: IWorkerAelMetric[] } = $props();
  const { sortWorkerAel } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortWorkerAel.field, sortWorkerAel.order),
    )
  );
  let isExpanded = $state(true);

  function updateSort(field: keyof IWorkerAelMetric, order: ESortOrder) {
    sortWorkerAel.field = field;
    sortWorkerAel.order = order;
    saveLocalStorage({ sortWorkerAel });
  }
</script>

{#if sortedMetrics.length}
  <table>
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          <CollapseExpand
            class="bc-invert"
            {isExpanded}
            onClick={() => void (isExpanded = !isExpanded)}
          />
          <ColumnSortable
            sort={sortWorkerAel}
            by="firstSeen"
            update={updateSort}
          >
            addEventListener [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerAel}
            by="eventSelfTime"
            update={updateSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c" title="Events per second">EPS</th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerAel}
            by="events"
            update={updateSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerAel}
            by="facts"
            update={updateSort}
          ><span class="icon -facts"></span></ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerAel}
            by="calls"
            update={updateSort}
          >Called</ColumnSortable>
        </th>
        <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
        <th class="ta-c" title="Breakpoint">
          <span class="icon -breakpoint"></span>
        </th>
      </tr>
    </thead>

    <tbody class:d-none={!isExpanded}>
      {#each sortedMetrics as metric (metric.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack trace={metric.trace} />
          </td>
          <td class="ta-r">
            <CellSelfTime time={metric.eventSelfTime} />
          </td>
          <td class="ta-c">{metric.eps || undefined}</td>
          <td class="ta-c"><Variable value={metric.events} /></td>
          <td class="ta-c">
            <CellFacts
              facts={metric.facts}
              factsMap={WorkerAelFacts}
            />
          </td>
          <td class="ta-c" title="&lt;called&gt; [&lt;removed&gt;]">
            <Variable value={metric.calls} />
            {#if metric.canceledCounter}
              [<Variable value={metric.canceledCounter} />]
            {/if}
          </td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
