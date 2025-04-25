<script lang="ts">
  import type { TClearTimerHistory } from '../../wrapper/TimerWrapper.ts';
  import {
    type ESortOrder,
    saveLocalStorage,
  } from '../../api/storage.local.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from '../components/Variable.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import TimersClearHistoryMetric from './components/TimersClearHistoryMetric.svelte';
  import { useConfigState } from '../../state/config.state.svelte.ts';

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
        <SortableColumn
          field="facts"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortClearTimers.field}
          currentFieldOrder={sortClearTimers.order}
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
