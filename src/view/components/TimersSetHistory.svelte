<script lang="ts">
  import type { TClearTimerHistory, TSetTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import TraceDomain from '@/view/components/TraceDomain.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    ETimerHistoryField,
    setSettings,
    type ETimerHistoryFieldKeys,
    type ESortOrderKeys,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import TimersClearHistory from '@/view/components/TimersClearHistory.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';

  export let caption: string;
  export let metrics: TSetTimerHistory[];
  export let clearTimeoutHistory: TClearTimerHistory[] | null;
  export let clearIntervalHistory: TClearTimerHistory[] | null;

  let field: ETimerHistoryFieldKeys = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrderKeys = DEFAULT_SORT.timersHistoryOrder;
  let dialog: HTMLDialogElement | null = null;

  $: metrics.sort(compareByFieldOrder(field, order));

  getSettings().then((settings) => {
    field = settings.sort.timersHistoryField;
    order = settings.sort.timersHistoryOrder;
  });

  function onChangeSort(
    e: CustomEvent<{ field: ETimerHistoryFieldKeys; order: ESortOrderKeys }>
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

  function onHideRegressor() {
    document.removeEventListener('keydown', onKeyboardEvent);
    dialog?.close();
    timersClearHistoryMetric = null;
  }

  let timersClearHistoryMetric: TClearTimerHistory[] | null;

  function onShowRegressors(regressors: string[] | null) {
    timersClearHistoryMetric = null;
    if (!dialog || !regressors?.length) {
      return;
    }

    const records = [];

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = clearTimeoutHistory?.find((r) => r.traceId === traceId);
      record ??= clearIntervalHistory?.find((r) => r.traceId === traceId);
      if (record) {
        records.push(record);
      }
    }

    if (!records.length) {
      return;
    }

    timersClearHistoryMetric = records;

    dialog.showModal();
    document.addEventListener('keydown', onKeyboardEvent);
  }
</script>

<dialog bind:this={dialog}>
  {#if timersClearHistoryMetric}
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
    <TimersClearHistory
      caption="Canceled by"
      bind:metrics={timersClearHistoryMetric}
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
    <th class="shaft"></th>
  </tr>

  {#each metrics as metric (metric.traceId)}
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

<style lang="scss">
  .shaft {
    min-width: var(--small-icon-size);
  }
  dialog {
    background-color: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);

    .header {
      display: flex;
      flex-wrap: nowrap;
      margin-bottom: 0.5rem;

      .title {
        flex-grow: 1;
        font-size: large;
        .requirement {
          font-size: x-small;
        }
      }
      .close-icon {
        text-decoration: none;
      }
    }
  }
</style>
