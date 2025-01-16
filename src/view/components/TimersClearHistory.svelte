<script lang="ts">
  import type { TClearTimerHistory } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT_CLEAR_TIMERS,
    getSettings,
    setSettings,
    type ESortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from './Variable.svelte';
  import SortableColumn from './SortableColumn.svelte';
  import TimersClearHistoryMetric from './TimersClearHistoryMetric.svelte';

  let { metrics, caption }: { metrics: TClearTimerHistory[]; caption: string } =
    $props();
  let sortField = $state(DEFAULT_SORT_CLEAR_TIMERS.field);
  let sortOrder = $state(DEFAULT_SORT_CLEAR_TIMERS.order);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortClearTimers.field;
    sortOrder = settings.sortClearTimers.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TClearTimerHistory>_field;
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
  <caption class="bc-invert ta-l">
    {caption}
    <Variable value={metrics.length} />
  </caption>
  <tbody>
    <tr>
      <th title="Breakpoint">BP</th>
      <th class="w-full">Callstack</th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Called</SortableColumn
        >
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Handler</SortableColumn
        >
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Delay</SortableColumn
        >
      </th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <TimersClearHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
