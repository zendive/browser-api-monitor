<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CollapseExpand from './CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import {
    type IWorkerAelMetric,
    WorkerAELFacts,
  } from '../../../wrapper/WorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: IWorkerAelMetric[] } = $props();
  const { sortWorkerAEL } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortWorkerAEL.field, sortWorkerAEL.order),
    )
  );
  let isExpanded = $state(true);

  function onChangeSort(field: string, order: ESortOrder) {
    sortWorkerAEL.field = <keyof IWorkerAelMetric> field;
    sortWorkerAEL.order = order;

    saveLocalStorage({ sortWorkerAEL: $state.snapshot(sortWorkerAEL) });
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
            field="firstSeen"
            currentField={sortWorkerAEL.field}
            currentFieldOrder={sortWorkerAEL.order}
            eventChangeSorting={onChangeSort}
          >
            addEventListener [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            field="eventSelfTime"
            currentField={sortWorkerAEL.field}
            currentFieldOrder={sortWorkerAEL.order}
            eventChangeSorting={onChangeSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">
          <ColumnSortable
            field="events"
            currentField={sortWorkerAEL.field}
            currentFieldOrder={sortWorkerAEL.order}
            eventChangeSorting={onChangeSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c" title="Facts">
          <ColumnSortable
            field="facts"
            currentField={sortWorkerAEL.field}
            currentFieldOrder={sortWorkerAEL.order}
            eventChangeSorting={onChangeSort}
          >
            <span class="icon -facts"></span>
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            field="calls"
            currentField={sortWorkerAEL.field}
            currentFieldOrder={sortWorkerAEL.order}
            eventChangeSorting={onChangeSort}
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
            <CellCallstack
              trace={metric.trace}
              traceDomain={metric.traceDomain}
            />
          </td>
          <td class="ta-r">
            <CellSelfTime time={metric.eventSelfTime} />
          </td>
          <td class="ta-c">{metric.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={metric.events} /></td>
          <td class="ta-c">
            <CellFacts
              facts={metric.facts}
              factsMap={WorkerAELFacts}
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
