<script lang="ts">
  import type { TCancelIdleCallbackHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import TraceDomain from '@/view/components/TraceDomain.svelte';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    setSettings,
    EHistorySortField,
    type EHistorySortFieldKeys,
    type ESortOrderKeys,
  } from '@/api/settings.ts';
  import { compareByFieldOrder } from '@/api/comparator.ts';

  export let caption: string = '';
  export let metrics: TCancelIdleCallbackHistory[];

  let field = DEFAULT_SORT.timersHistoryField;
  let order = DEFAULT_SORT.timersHistoryOrder;

  $: sortedMetrics = metrics.sort(
    compareByFieldOrder(<keyof TCancelIdleCallbackHistory>field, order)
  );

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(
    e: CustomEvent<{ field: EHistorySortFieldKeys; order: ESortOrderKeys }>
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
        field={EHistorySortField.calls}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Called</TimersHistoryCellSort
      >
    </th>
    <th class="ta-c">
      <TimersHistoryCellSort
        field={EHistorySortField.handler}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Handler</TimersHistoryCellSort
      >
    </th>
  </tr>

  {#each sortedMetrics as metric (metric.traceId)}
    <tr class="t-zebra" class:bc-error={metric.hasError}>
      <td><TraceDomain bind:traceDomain={metric.traceDomain} /></td>
      <td class="wb-all">
        <Trace bind:trace={metric.trace} bind:traceId={metric.traceId}/>
      </td>
      <td class="ta-c">{metric.calls}</td>
      <td class="ta-c">{metric.handler}</td>
    </tr>
  {/each}
</table>

<style>
  .shaft {
    min-width: var(--small-icon-size);
  }
</style>
