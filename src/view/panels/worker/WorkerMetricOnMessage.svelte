<script lang="ts">
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { IWorkerOnMessageMetric } from '../../../wrapper/WorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: IWorkerOnMessageMetric[] } = $props();
  const { sortWorkerOnMessage } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortWorkerOnMessage.field, sortWorkerOnMessage.order),
    )
  );
  let isExpanded = $state(true);

  function updateSort(field: keyof IWorkerOnMessageMetric, order: ESortOrder) {
    sortWorkerOnMessage.field = field;
    sortWorkerOnMessage.order = order;
    saveLocalStorage({ sortWorkerOnMessage });
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
            sort={sortWorkerOnMessage}
            by="firstSeen"
            update={updateSort}
          >
            set onmessage [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerOnMessage}
            by="eventSelfTime"
            update={updateSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c" title="Calls per second">CPS</th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerOnMessage}
            by="events"
            update={updateSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortWorkerOnMessage}
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
          <td class="ta-c">{metric.eventsCps || undefined}</td>
          <td class="ta-c"><Variable value={metric.events} /></td>
          <td class="ta-c"><Variable value={metric.calls} /></td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
