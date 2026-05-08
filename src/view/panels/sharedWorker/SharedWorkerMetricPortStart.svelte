<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CollapseExpand from '../shared/CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import type { ESortOrder } from '../../../api/const';
  import type { ISharedWorkerPortStartMetric } from '../../../wrapper/SharedWorkerWrapper';
  import { useConfigState } from '../../../state/config.state.svelte';
  import { compareByFieldOrder } from '../shared/comparator';
  import { saveLocalStorage } from '../../../api/storage/storage.local';

  let { metrics }: { metrics: ISharedWorkerPortStartMetric[] } = $props();
  const { sortSharedWorkerPortStart } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(
        sortSharedWorkerPortStart.field,
        sortSharedWorkerPortStart.order,
      ),
    )
  );
  let isExpanded = $state(true);

  function updateSort(
    field: keyof ISharedWorkerPortStartMetric,
    order: ESortOrder,
  ) {
    sortSharedWorkerPortStart.field = field;
    sortSharedWorkerPortStart.order = order;
    saveLocalStorage({ sortSharedWorkerPortStart });
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
            sort={sortSharedWorkerPortStart}
            by="firstSeen"
            update={updateSort}
          >
            port.start [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortSharedWorkerPortStart}
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
          <td class="ta-c"><Variable value={metric.calls} /></td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
