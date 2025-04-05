<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../wrapper/TimerWrapper.ts';
  import {
    DEFAULT_SORT_SET_TIMERS,
    ESortOrder,
    getSettings,
    setSettings,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from './Variable.svelte';
  import SortableColumn from './SortableColumn.svelte';
  import TimersSetHistoryMetric from './TimersSetHistoryMetric.svelte';

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
  let sortField = $state(DEFAULT_SORT_SET_TIMERS.field);
  let sortOrder = $state(DEFAULT_SORT_SET_TIMERS.order);
  let sortedMetrics = $derived.by(() =>
    setTimerHistory.toSorted(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortSetTimers.field;
    sortOrder = settings.sortSetTimers.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TSetTimerHistory> _field;
    sortOrder = _order;

    setSettings({
      sortSetTimers: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
    });
  }
</script>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption} <Variable value={setTimerHistory.length} />
  </caption>
  <tbody>
    <tr>
      <th class="w-full">Callstack</th>
      <th class="ta-r">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Self</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Delay</SortableColumn>
      </th>
      <th>
        <SortableColumn
          field="online"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Set</SortableColumn>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <TimersSetHistoryMetric
        {metric}
        {clearTimeoutHistory}
        {clearIntervalHistory}
      />
    {/each}
  </tbody>
</table>
