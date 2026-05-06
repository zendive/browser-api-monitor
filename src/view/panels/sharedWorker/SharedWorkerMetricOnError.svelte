<script lang="ts">
  import CellBypass from '../shared/CellBypass.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { ISharedWorkerOnErrorMetric } from '../../../wrapper/SharedWorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: ISharedWorkerOnErrorMetric[] } = $props();
  const { sortSharedWorkerOnError } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(
        sortSharedWorkerOnError.field,
        sortSharedWorkerOnError.order,
      ),
    )
  );
  let isExpanded = $state(true);

  function updateSort(
    field: keyof ISharedWorkerOnErrorMetric,
    order: ESortOrder,
  ) {
    sortSharedWorkerOnError.field = field;
    sortSharedWorkerOnError.order = order;
    saveLocalStorage({ sortSharedWorkerOnError });
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
            sort={sortSharedWorkerOnError}
            by="firstSeen"
            update={updateSort}
          >
            set onerror [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortSharedWorkerOnError}
            by="eventSelfTime"
            update={updateSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortSharedWorkerOnError}
            by="events"
            update={updateSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortSharedWorkerOnError}
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
      {#each sortedMetrics as metrics (metrics.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <CellCallstack trace={metrics.trace} />
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
