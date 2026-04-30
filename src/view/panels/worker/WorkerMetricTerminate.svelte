<script lang="ts">
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CollapseExpand from './CollapseExpand.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { IWorkerTerminateMetric } from '../../../wrapper/WorkerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';

  let { metrics }: { metrics: IWorkerTerminateMetric[] } = $props();
  const { sortWorkerTerminate } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortWorkerTerminate.field, sortWorkerTerminate.order),
    )
  );
  let isExpanded = $state(true);

  function onChangeSort(field: string, order: ESortOrder) {
    sortWorkerTerminate.field = <keyof IWorkerTerminateMetric> field;
    sortWorkerTerminate.order = order;

    saveLocalStorage({
      sortWorkerTerminate: $state.snapshot(sortWorkerTerminate),
    });
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
            currentField={sortWorkerTerminate.field}
            currentFieldOrder={sortWorkerTerminate.order}
            eventChangeSorting={onChangeSort}
          >
            terminate [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            field="calls"
            currentField={sortWorkerTerminate.field}
            currentFieldOrder={sortWorkerTerminate.order}
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
          <td class="ta-c"><Variable value={metric.calls} /></td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
