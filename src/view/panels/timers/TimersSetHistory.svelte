<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import {
    ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import TimersSetHistoryMetric from './TimersSetHistoryMetric.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let {
    setTimerHistory,
    clearTimeoutHistory,
    clearIntervalHistory,
    caption,
  }: {
    setTimerHistory: TSetTimerHistory[];
    clearTimeoutHistory: TClearTimerHistory[] | null;
    clearIntervalHistory: TClearTimerHistory[] | null;
    caption?: string;
  } = $props();
  let { sortSetTimers } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    setTimerHistory.toSorted(
      compareByFieldOrder(sortSetTimers.field, sortSetTimers.order),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortSetTimers.field = <keyof TSetTimerHistory> field;
    sortSetTimers.order = order;

    saveLocalStorage({
      sortSetTimers: $state.snapshot(sortSetTimers),
    });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={setTimerHistory.length} />]
      </th>
      <th class="ta-r">
        <ColumnSortable
          field="selfTime"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          field="delay"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Delay</ColumnSortable>
      </th>
      <th>
        <ColumnSortable
          field="online"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Set</ColumnSortable>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <TimersSetHistoryMetric
        {metric}
        {clearTimeoutHistory}
        {clearIntervalHistory}
      />
    {/each}
  </tbody>
</table>
