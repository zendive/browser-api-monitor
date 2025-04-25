<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../wrapper/TimerWrapper.ts';
  import { ESortOrder, saveLocalStorage } from '../../api/storage.local.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from '../components/Variable.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import TimersSetHistoryMetric from './components/TimersSetHistoryMetric.svelte';
  import { useConfigState } from '../../state/config.state.svelte.ts';

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
        <SortableColumn
          field="selfTime"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Self</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="facts"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Delay</SortableColumn>
      </th>
      <th>
        <SortableColumn
          field="online"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Set</SortableColumn>
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
