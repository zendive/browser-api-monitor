<script lang="ts">
  import type { TClearTimerHistory } from '../../wrapper/TimerWrapper.ts';
  import {
    DEFAULT_SORT_CLEAR_TIMERS,
    type ESortOrder,
    getSettings,
    setSettings,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from '../components/Variable.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import TimersClearHistoryMetric from './components/TimersClearHistoryMetric.svelte';

  let {
    clearTimerHistory,
    caption,
  }: { clearTimerHistory: TClearTimerHistory[]; caption: string } =
    $props();
  let sortField = $state(DEFAULT_SORT_CLEAR_TIMERS.field);
  let sortOrder = $state(DEFAULT_SORT_CLEAR_TIMERS.order);
  let sortedMetrics = $derived.by(() =>
    clearTimerHistory.toSorted(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortClearTimers.field;
    sortOrder = settings.sortClearTimers.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TClearTimerHistory> _field;
    sortOrder = _order;

    setSettings({
      sortClearTimers: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
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
        <SortableColumn
          field="facts"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></SortableColumn>
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
