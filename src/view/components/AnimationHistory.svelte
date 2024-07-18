<script lang="ts">
  import type { TAnimationHistory } from '@/api/wrappers';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import {
    DEFAULT_SORT,
    ESortOrder,
    ETimerHistoryField,
    getSettings,
    setSettings,
  } from '@/api/settings.ts';
  import { compareByFieldOrder } from '@/api/comparator.ts';

  export let caption: string = '';
  export let metrics: TAnimationHistory[] = [];

  let field = DEFAULT_SORT.timersHistoryField;
  let order = DEFAULT_SORT.timersHistoryOrder;

  $: sortedMetrics = metrics.sort(
    compareByFieldOrder(<keyof TAnimationHistory>field, order)
  );

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
  </tr>

  {#each sortedMetrics as metric (metric.traceId)}
    <tr class="t-zebra" class:bc-error={metric.hasError}>
      <td class="wb-all">
        <Trace
          bind:trace={metric.trace}
          bind:traceDomain={metric.traceDomain}
        />
      </td>
      <td class="ta-c">{metric.calls}</td>
      <td class="ta-c">{metric.handler}</td>
    </tr>
  {/each}
</table>
