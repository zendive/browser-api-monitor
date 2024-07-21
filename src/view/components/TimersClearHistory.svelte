<script lang="ts">
  import type { TClearTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    ESortOrder,
    ETimerHistoryField,
    setSettings,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';
  import TimersClearHistoryMetric from '@/view/components/TimersClearHistoryMetric.svelte';

  export let caption: string = '';
  export let metrics: TClearTimerHistory[];

  let field: ETimerHistoryField = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrder = DEFAULT_SORT.timersHistoryOrder;

  $: metrics.sort(compareByFieldOrder(field, order));

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(
    e: CustomEvent<{ field: ETimerHistoryField; order: ESortOrder }>
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
  <tr>
    <th class="shaft"></th>
    <th class="w-full">Callstack</th>
    <th class="ta-c">
      <TimersHistoryCellSort
        field={ETimerHistoryField.calls}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Called</TimersHistoryCellSort
      >
    </th>
    <th class="ta-c">
      <TimersHistoryCellSort
        field={ETimerHistoryField.handler}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Handler</TimersHistoryCellSort
      >
    </th>
    <th class="ta-r">
      <TimersHistoryCellSort
        field={ETimerHistoryField.delay}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Delay</TimersHistoryCellSort
      >
    </th>
  </tr>

  {#each metrics as metric (metric.traceId)}
    <TimersClearHistoryMetric bind:metric />
  {/each}
</table>

<style>
  .shaft {
    min-width: 0.7rem;
  }
</style>
