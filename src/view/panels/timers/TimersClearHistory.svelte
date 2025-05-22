<script lang="ts">
  import type { TClearTimerHistory } from '../../../wrapper/TimerWrapper.ts';
  import {
    type ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import TimersClearHistoryMetric from './TimersClearHistoryMetric.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let {
    clearTimerHistory,
    caption,
  }: { clearTimerHistory: TClearTimerHistory[]; caption: string } =
    $props();
  const { sortClearTimers } = useConfigState();
  let sortedMetrics = $derived.by(() =>
    clearTimerHistory.toSorted(
      compareByFieldOrder(sortClearTimers.field, sortClearTimers.order),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortClearTimers.field = <keyof TClearTimerHistory> field;
    sortClearTimers.order = order;

    saveLocalStorage({
      sortClearTimers: $state.snapshot(sortClearTimers),
    });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={clearTimerHistory.length} />]
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          field="delay"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        >Delay</ColumnSortable>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <TimersClearHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
