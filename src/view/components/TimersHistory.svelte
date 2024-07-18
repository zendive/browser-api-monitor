<script lang="ts">
  import type { TTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    ESortOrder,
    ETimerHistoryField,
    setSettings,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';

  export let caption: string = '';
  export let metrics: TTimerHistory[] = [];

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
    <tr class="t-zebra" class:bc-error={metric.hasError}>
      <td class="wb-all">
        <Trace
          bind:trace={metric.trace}
          bind:traceDomain={metric.traceDomain}
        />
      </td>
      <td class="ta-c">
        <Variable bind:value={metric.calls} />
      </td>
      <td class="ta-c">{metric.handler}</td>
      <td class="ta-r">{metric.delay}</td>
    </tr>
  {/each}
</table>
callscalls
