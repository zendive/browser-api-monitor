<script lang="ts">
  import type { TCancelIdleCallbackHistory } from '../../../wrapper/IdleWrapper.ts';
  import {
    type ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import IdleCallbackCancelHistoryMetric from './IdleCallbackCancelHistoryMetric.svelte';

  let {
    cicHistory,
    caption = '',
  }: { cicHistory: TCancelIdleCallbackHistory[]; caption?: string } =
    $props();
  const { sortCancelIdleCallback } = useConfigState();
  let sortedMetrics = $derived.by(() =>
    cicHistory.toSorted(
      compareByFieldOrder(
        sortCancelIdleCallback.field,
        sortCancelIdleCallback.order,
      ),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortCancelIdleCallback.field = <keyof TCancelIdleCallbackHistory> field;
    sortCancelIdleCallback.order = order;

    saveLocalStorage({
      sortCancelIdleCallback: $state.snapshot(sortCancelIdleCallback),
    });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={cicHistory.length} />]
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortCancelIdleCallback.field}
          currentFieldOrder={sortCancelIdleCallback.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortCancelIdleCallback.field}
          currentFieldOrder={sortCancelIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortCancelIdleCallback.field}
          currentFieldOrder={sortCancelIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <IdleCallbackCancelHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
