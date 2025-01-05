<script lang="ts">
  import type {
    TRequestIdleCallbackHistory,
    TCancelIdleCallbackHistory,
  } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT,
    getSettings,
    setSettings,
    HistorySortField,
    type THistorySortField,
    type TSortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { CALLED_ABORTED_TOOLTIP } from '../../api/const.ts';
  import { Stopper } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import TimersHistoryCellSort from './TimersHistoryCellSort.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';
  import Dialog from './Dialog.svelte';
  import Alert from './Alert.svelte';

  let {
    metrics,
    cicHistory = null,
    caption = '',
  }: {
    metrics: TRequestIdleCallbackHistory[];
    cicHistory: TCancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();

  let field = $state(DEFAULT_SORT.timersHistoryField);
  let order = $state(DEFAULT_SORT.timersHistoryOrder);
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;

  let sortedMetrics = $derived.by(() =>
    metrics.sort(
      compareByFieldOrder(<keyof TRequestIdleCallbackHistory>field, order)
    )
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

  let cicHistoryMetrics: TCancelIdleCallbackHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = cicHistory?.find((r) => r.traceId === traceId);
      if (record) {
        cicHistoryMetrics.push(record);
      }
    }

    if (cicHistoryMetrics.length) {
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    cicHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  eventClose={onCloseDialog}
  title="Places from which requestIdleCallback with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. For full coverage - requires cancelIdleCallback panels enabled."
>
  <IdleCallbackCancelHistory
    caption="Canceled by"
    metrics={$state.snapshot(cicHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires cancelIdleCallback panel enabled
</Alert>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption}
    <Variable value={metrics.length} />
  </caption>
  <tbody>
    <tr>
      <th class="shaft"></th>
      <th class="w-full">Callstack</th>
      <th class="ta-c">didTimeout</th>
      <th class="ta-c">
        <TimersHistoryCellSort
          field={HistorySortField.selfTime}
          currentField={field}
          currentFieldOrder={order}
          eventChangeSorting={onChangeSort}>Self</TimersHistoryCellSort
        >
      </th>
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
      <th class="shaft"></th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td><TraceDomain traceDomain={metric.traceDomain} /></td>
        <td class="wb-all"
          ><Trace trace={metric.trace} traceId={metric.traceId} /></td
        >
        <td class="ta-c">{metric.didTimeout}</td>
        <td class="ta-r">{Stopper.toString(metric.selfTime)}</td>
        <td class="ta-c">
          <Variable value={metric.calls} />{#if metric.canceledCounter}-<a
              role="button"
              href="void(0)"
              title={CALLED_ABORTED_TOOLTIP}
              onclick={(e) => {
                e.preventDefault();
                onFindRegressors(metric.canceledByTraceIds);
              }}
              ><Variable value={metric.canceledCounter} />/{metric
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
