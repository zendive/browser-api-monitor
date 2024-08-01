<script lang="ts">
  import type {
    TRequestIdleCallbackHistory,
    TCancelIdleCallbackHistory,
  } from '@/api/wrappers.ts';
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
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';

  export let caption: string = '';
  export let metrics: TRequestIdleCallbackHistory[];

  let field = DEFAULT_SORT.timersHistoryField;
  let order = DEFAULT_SORT.timersHistoryOrder;
  let dialog: HTMLDialogElement | null = null;
  export let cicHistory: TCancelIdleCallbackHistory[] | null;

  $: sortedMetrics = metrics.sort(
    compareByFieldOrder(<keyof TRequestIdleCallbackHistory>field, order)
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

  function onKeyboardEvent(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopImmediatePropagation();
      onHideRegressor();
    }
  }

  let cicHistoryMetrics: TCancelIdleCallbackHistory[] | null;

  function onHideRegressor() {
    document.removeEventListener('keydown', onKeyboardEvent);
    dialog?.close();
    cicHistoryMetrics = null;
  }

  function onShowRegressors(regressors: string[] | null) {
    cicHistoryMetrics = null;
    if (!dialog || !regressors?.length) {
      return;
    }

    const records = [];

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = cicHistory?.find((r) => r.traceId === traceId);
      if (record) {
        records.push(record);
      }
    }

    if (!records.length) {
      return;
    }

    cicHistoryMetrics = records;

    dialog.showModal();
    document.addEventListener('keydown', onKeyboardEvent);
  }
</script>

<dialog bind:this={dialog}>
  {#if cicHistoryMetrics}
    <div class="header">
      <div class="title">
        <div>
          Places from which timer with current callstack was prematurely
          canceled:
        </div>
        <div class="requirement">
          The information is actual only on time of demand. For full coverage -
          requires both clearTimeout and clearInterval panels enabled.
        </div>
      </div>
      <a
        title="Close"
        class="close-icon"
        href="void(0)"
        on:click|preventDefault={onHideRegressor}
      >
        <span class="icon -remove" />
      </a>
    </div>
    <IdleCallbackCancelHistory
      caption="Canceled by"
      bind:metrics={cicHistoryMetrics}
    />
  {/if}
</dialog>

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
    <th class="ta-c">didTimeout</th>
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
      <td class="ta-c">{metric.calls}</td>
      <td class="ta-c">{metric.handler}</td>
      <td class="ta-c">
        {#if metric.didTimeout !== undefined}
          {metric.didTimeout}
        {/if}
      </td>
      <td class="ta-r">{metric.delay}</td>
      <td>
        {#if metric.isOnline}
          <span title="Scheduled" class="icon -scheduled -small" />
        {:else if metric.canceledByTraceIds?.length}
          <a
            role="button"
            title={`Canceled by ${metric.canceledByTraceIds?.length}`}
            href="void(0)"
            on:click|preventDefault={() =>
              void onShowRegressors(metric.canceledByTraceIds)}
          >
            <span class="icon -remove -small" />
          </a>
        {/if}
      </td>
    </tr>
  {/each}
</table>

<style>
  .shaft {
    min-width: var(--small-icon-size);
  }
</style>
