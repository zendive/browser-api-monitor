<script lang="ts">
  import type { ICancelIdleCallbackHistory } from '../../../wrapper/IdleWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import IdleCallbackCancelHistoryMetric from './IdleCallbackCancelHistoryMetric.svelte';

  let {
    cicHistory,
    caption = '',
  }: {
    cicHistory: ICancelIdleCallbackHistory[];
    caption?: string;
  } = $props();
  const { sortCancelIdleCallback } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    cicHistory.toSorted(
      compareByFieldOrder(
        sortCancelIdleCallback.field,
        sortCancelIdleCallback.order,
      ),
    )
  );

  function updateSort(
    field: keyof ICancelIdleCallbackHistory,
    order: ESortOrder,
  ) {
    sortCancelIdleCallback.field = field;
    sortCancelIdleCallback.order = order;
    saveLocalStorage({ sortCancelIdleCallback });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          sort={sortCancelIdleCallback}
          by="firstSeen"
          update={updateSort}
        >
          {caption} [<Variable value={cicHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortCancelIdleCallback}
          by="facts"
          update={updateSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortCancelIdleCallback}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortCancelIdleCallback}
          by="handler"
          update={updateSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <IdleCallbackCancelHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
