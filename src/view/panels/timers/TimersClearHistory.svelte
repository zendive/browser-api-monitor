<script lang="ts">
  import type { IClearTimerHistory } from '../../../wrapper/TimerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import TimersClearHistoryMetric from './TimersClearHistoryMetric.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import ColumnSortable from '../shared/ColumnSortable.svelte';

  let {
    clearTimerHistory,
    caption,
  }: {
    clearTimerHistory: IClearTimerHistory[];
    caption: string;
  } = $props();
  const { sortClearTimers } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    clearTimerHistory.toSorted(
      compareByFieldOrder(sortClearTimers.field, sortClearTimers.order),
    )
  );

  function updateSort(field: keyof IClearTimerHistory, order: ESortOrder) {
    sortClearTimers.field = field;
    sortClearTimers.order = order;
    saveLocalStorage({ sortClearTimers });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          sort={sortClearTimers}
          by="firstSeen"
          update={updateSort}
        >
          {caption} [<Variable value={clearTimerHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortClearTimers}
          by="facts"
          update={updateSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortClearTimers}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortClearTimers}
          by="handler"
          update={updateSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          sort={sortClearTimers}
          by="delay"
          update={updateSort}
        >Delay</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <TimersClearHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
