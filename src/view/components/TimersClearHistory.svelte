<script lang="ts">
  import type { TClearTimerHistory } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT,
    getSettings,
    HistorySortField,
    setSettings,
    type THistorySortField,
    type TSortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from './Variable.svelte';
  import TimersHistoryCellSort from './TimersHistoryCellSort.svelte';
  import TimersClearHistoryMetric from './TimersClearHistoryMetric.svelte';

  let { metrics, caption }: { metrics: TClearTimerHistory[]; caption: string } =
    $props();
  let field: THistorySortField = $state(DEFAULT_SORT.timersHistoryField);
  let order: TSortOrder = $state(DEFAULT_SORT.timersHistoryOrder);
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(field, order))
  );

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(_field: THistorySortField, _order: TSortOrder) {
    field = _field;
    order = _order;

    setSettings({
      sort: {
        timersHistoryField: $state.snapshot(_field),
        timersHistoryOrder: $state.snapshot(_order),
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
      <th class="shaft"></th>
      <th class="w-full">Callstack</th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.calls}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Called</TimersHistoryCellSort
        >
      </th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.handler}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Handler</TimersHistoryCellSort
        >
      </th>
      <th class="ta-r">
        <TimersHistoryCellSort
          field={HistorySortField.delay}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Delay</TimersHistoryCellSort
        >
      </th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <TimersClearHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
