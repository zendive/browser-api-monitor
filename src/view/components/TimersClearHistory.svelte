<script lang="ts">
  import type { TClearTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    HistorySortField,
    setSettings,
    type THistorySortField,
    type TSortOrder,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';
  import TimersClearHistoryMetric from '@/view/components/TimersClearHistoryMetric.svelte';

  export let caption: string = '';
  export let metrics: TClearTimerHistory[];

  let field: THistorySortField = DEFAULT_SORT.timersHistoryField;
  let order: TSortOrder = DEFAULT_SORT.timersHistoryOrder;

  $: sortedMetrics = metrics.sort(compareByFieldOrder(field, order));

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(
    e: CustomEvent<{ field: THistorySortField; order: TSortOrder }>
  ) {
    field = e.detail.field;
    order = e.detail.order;
    setSettings({
      sort: {
        timersHistoryField: field,
        timersHistoryOrder: order,
      },
    });
  }
</script>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption}
    <Variable bind:value={metrics.length} />
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
          on:changeSort={onChangeSort}>Called</TimersHistoryCellSort
        >
      </th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.handler}
          currentField={field}
          currentFieldOrder={order}
          on:changeSort={onChangeSort}>Handler</TimersHistoryCellSort
        >
      </th>
      <th class="ta-r">
        <TimersHistoryCellSort
          field={HistorySortField.delay}
          currentField={field}
          currentFieldOrder={order}
          on:changeSort={onChangeSort}>Delay</TimersHistoryCellSort
        >
      </th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <TimersClearHistoryMetric bind:metric />
    {/each}
  </tbody>
</table>
