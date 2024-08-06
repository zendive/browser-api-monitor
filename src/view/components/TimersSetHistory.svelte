<script lang="ts">
  import type { TClearTimerHistory, TSetTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import TraceDomain from '@/view/components/TraceDomain.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    EHistorySortField,
    setSettings,
    type EHistorySortFieldKeys,
    type ESortOrderKeys,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import TimersClearHistory from '@/view/components/TimersClearHistory.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';
  import Dialog from '@/view/components/Dialog.svelte';

  export let caption: string;
  export let metrics: TSetTimerHistory[];
  export let clearTimeoutHistory: TClearTimerHistory[] | null;
  export let clearIntervalHistory: TClearTimerHistory[] | null;

  let field: EHistorySortFieldKeys = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrderKeys = DEFAULT_SORT.timersHistoryOrder;
  let dialog: Dialog | null = null;

  $: sortedMetrics = metrics.sort(compareByFieldOrder(field, order));

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

  let clearTimerHistoryMetrics: TClearTimerHistory[] = [];

  function onFindRegressors(regressors: string[] | null) {
    if (!dialog || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = clearTimeoutHistory?.find((r) => r.traceId === traceId);
      record ??= clearIntervalHistory?.find((r) => r.traceId === traceId);
      if (record) {
        clearTimerHistoryMetrics.push(record);
      }
    }

    if (clearTimerHistoryMetrics.length) {
      dialog.showModal();
    }
  }

  function onCloseDialog() {
    clearTimerHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialog}
  on:closeDialog={onCloseDialog}
  title="Places from which timer with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. For full coverage - requires both clearTimeout and clearInterval panels enabled."
>
  <TimersClearHistory
    caption="Canceled by"
    bind:metrics={clearTimerHistoryMetrics}
  />
</Dialog>

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
    <th class="ta-r">
      <TimersHistoryCellSort
        field={EHistorySortField.delay}
        currentField={field}
        currentFieldOrder={order}
        on:changeSort={onChangeSort}>Delay</TimersHistoryCellSort
      >
    </th>
    <th class="shaft"></th>
  </tr>

  {#each sortedMetrics as metric (metric.traceId)}
    <tr class="t-zebra" class:bc-error={metric.hasError}>
      <td><TraceDomain bind:traceDomain={metric.traceDomain} /></td>
      <td class="wb-all">
        <Trace bind:trace={metric.trace} />
      </td>
      <td class="ta-c">
        <Variable bind:value={metric.calls} />
      </td>
      <td class="ta-c">{metric.handler}</td>
      <td class="ta-r">{metric.delay}</td>
      <td>
        {#if metric.canceledByTraceIds?.length}
          <a
            role="button"
            title={`${metric.isOnline ? 'Scheduled. ' : ''}Canceled by ${metric.canceledByTraceIds?.length}`}
            href="void(0)"
            on:click|preventDefault={() =>
              void onFindRegressors(metric.canceledByTraceIds)}
          >
            {#if metric.isOnline}
              <span class="icon -scheduled -small" />
            {:else}
              <span class="icon -remove -small" />
            {/if}
          </a>
        {:else if metric.isOnline}
          <span title="Scheduled" class="icon -scheduled -small" />
        {/if}
      </td>
    </tr>
  {/each}
</table>

<style lang="scss">
  .shaft {
    min-width: var(--small-icon-size);
  }
</style>
