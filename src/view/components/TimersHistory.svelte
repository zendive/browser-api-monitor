<script lang="ts">
  import type { TTimerHistory } from '@/api/wrappers';
  import Variable from './Variable.svelte';
  import Callstack from './Callstack.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    ESortOrder,
    ETimerHistoryField,
    setSettings,
  } from '@/api/settings';
  import TimersHistoryCellSort from './TimersHistoryCellSort.svelte';

  export let caption: string = '';
  export let metrics: TTimerHistory[] = [];

  let field: ETimerHistoryField = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrder = DEFAULT_SORT.timersHistoryOrder;

  $: sortedMetrics = metrics.sort((a, b) => {
    const first = a[field] || 0;
    const second = b[field] || 0;

    return order === ESortOrder.DESCENDING
      ? second > first
        ? 1
        : -1
      : first > second
        ? 1
        : -1;
  });

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(
    e: CustomEvent<{ field: ETimerHistoryField; order: ESortOrder }>
  ) {
    setSettings({
      sort: {
        timersHistoryField: e.detail.field,
        timersHistoryOrder: e.detail.order,
      },
    });

    field = e.detail.field;
    order = e.detail.order;
  }
</script>

<table>
  <caption class="bc-invert ta-l">
    {caption}
    <Variable bind:value={metrics.length} />
  </caption>
  <tr>
    <th class="w-full">
      <TimersHistoryCellSort
        field={ETimerHistoryField.traceId}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Callstack</TimersHistoryCellSort
      >
    </th>
    <th>
      <TimersHistoryCellSort
        field={ETimerHistoryField.individualInvocations}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Called</TimersHistoryCellSort
      >
    </th>
    <th>
      <TimersHistoryCellSort
        field={ETimerHistoryField.recentHandler}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Handler</TimersHistoryCellSort
      >
    </th>
    <th>
      <TimersHistoryCellSort
        field={ETimerHistoryField.handlerDelay}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Delay</TimersHistoryCellSort
      >
    </th>
  </tr>

  {#each sortedMetrics as metric (metric.traceId)}
    <tr
      class="t-zebra"
      class:bc-error={typeof metric.recentHandler !== 'number' ||
        metric.recentHandler < 1}
    >
      <td class="wb-all">
        <Callstack bind:trace={metric.trace} />
      </td>
      <td class="ta-c">
        <Variable bind:value={metric.individualInvocations} />
      </td>
      <td class="ta-c">{metric.recentHandler}</td>
      <td class="ta-r">{metric.handlerDelay}</td>
    </tr>
  {/each}
</table>

<style lang="scss">
</style>
