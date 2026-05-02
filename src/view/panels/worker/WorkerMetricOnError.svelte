<script lang="ts">
  import CellBypass from '../shared/CellBypass.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { IWorkerOnErrorMetric } from '../../../wrapper/WorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: IWorkerOnErrorMetric[] } = $props();
  const { sortWorkerOnError } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortWorkerOnError.field, sortWorkerOnError.order),
    )
  );
  let isExpanded = $state(true);

  function onChangeSort(field: string, order: ESortOrder) {
    sortWorkerOnError.field = <keyof IWorkerOnErrorMetric> field;
    sortWorkerOnError.order = order;

    saveLocalStorage({ sortWorkerOnError: $state.snapshot(sortWorkerOnError) });
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
            currentField={sortWorkerOnError.field}
            currentFieldOrder={sortWorkerOnError.order}
            eventChangeSorting={onChangeSort}
          >
            set onerror [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            field="eventSelfTime"
            currentField={sortWorkerOnError.field}
            currentFieldOrder={sortWorkerOnError.order}
            eventChangeSorting={onChangeSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">
          <ColumnSortable
            field="events"
            currentField={sortWorkerOnError.field}
            currentFieldOrder={sortWorkerOnError.order}
            eventChangeSorting={onChangeSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            field="calls"
            currentField={sortWorkerOnError.field}
            currentFieldOrder={sortWorkerOnError.order}
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
      {#each sortedMetrics as metrics (metrics.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack
              trace={metrics.trace}
              traceDomain={metrics.traceDomain}
            />
          </td>
          <td class="ta-r">
            <CellSelfTime time={metrics.eventSelfTime} />
          </td>
          <td class="ta-c">{metrics.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={metrics.events} /></td>
          <td class="ta-c"><Variable value={metrics.calls} /></td>
          <td><CellBypass traceId={metrics.traceId} /></td>
          <td><CellBreakpoint traceId={metrics.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
