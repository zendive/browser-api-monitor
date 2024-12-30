<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT,
    getSettings,
    HistorySortField,
    setSettings,
    type THistorySortField,
    type TSortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { CALLED_ABORTED_TOOLTIP } from '../../api/const.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import TimersHistoryCellSort from './TimersHistoryCellSort.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import Dialog from './Dialog.svelte';
  import Alert from './Alert.svelte';

  export let caption: string;
  export let metrics: TSetTimerHistory[];
  export let clearTimeoutHistory: TClearTimerHistory[] | null;
  export let clearIntervalHistory: TClearTimerHistory[] | null;

  let field: THistorySortField = DEFAULT_SORT.timersHistoryField;
  let order: TSortOrder = DEFAULT_SORT.timersHistoryOrder;
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;

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

  let clearTimerHistoryMetrics: TClearTimerHistory[] = [];

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
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
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    clearTimerHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  on:close={onCloseDialog}
  title="Places from which timer with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. For full coverage - requires both clearTimeout and clearInterval panels enabled."
>
  <TimersClearHistory
    caption="Canceled by"
    bind:metrics={clearTimerHistoryMetrics}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires both clearTimeout and clearInterval panels enabled
</Alert>

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
      <th class="shaft"></th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td><TraceDomain bind:traceDomain={metric.traceDomain} /></td>
        <td class="wb-all">
          <Trace bind:trace={metric.trace} bind:traceId={metric.traceId} />
        </td>
        <td class="ta-c">
          <Variable bind:value={metric.calls} />{#if metric.canceledCounter}-<a
              role="button"
              href="void(0)"
              title={CALLED_ABORTED_TOOLTIP}
              on:click|preventDefault={() =>
                void onFindRegressors(metric.canceledByTraceIds)}
              ><Variable bind:value={metric.canceledCounter} />/{metric
                .canceledByTraceIds?.length}
            </a>
          {/if}
        </td>
        <td class="ta-c">{metric.handler}</td>
        <td class="ta-r">{metric.delay}</td>
        <td>
          {#if metric.isOnline}
            <span title="Scheduled" class="icon -scheduled -small"></span>
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
