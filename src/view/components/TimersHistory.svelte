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

  export let caption: string = '';
  export let metrics: TTimerHistory[] = [];

  let field: ETimerHistoryField = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrder = DEFAULT_SORT.timersHistoryOrder;

  $: sortedMetrics = metrics.sort((first, second) => {
    const a = first[field];
    const b = second[field];

    if (a === undefined) {
      return ESortOrder.DESCENDING ? -1 : 1;
    } else if (b === undefined) {
      return ESortOrder.DESCENDING ? 1 : -1;
    }

    if (
      (typeof a === 'number' && typeof b === 'number') ||
      (typeof a === 'string' && typeof b === 'string')
    ) {
      return order === ESortOrder.DESCENDING
        ? b > a
          ? 1
          : b < a
            ? -1
            : 0
        : a > b
          ? 1
          : a < b
            ? -1
            : 0;
    } else {
      return typeof (ESortOrder.DESCENDING ? b : a) === 'number' ? -1 : 1;
    }
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

<table data-navigation-tag={caption}>
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
    <tr class="t-zebra" class:bc-error={metric.hasError}>
      <td class="wb-all">
        <Trace bind:trace={metric.trace} />
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
