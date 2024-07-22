<script lang="ts">
  import type { TClearTimerHistory, TSetTimerHistory } from '@/api/wrappers.ts';
  import Variable from '@/view/components/Variable.svelte';
  import Trace from '@/view/components/Trace.svelte';
  import TraceDomain from '@/view/components/TraceDomain.svelte';
  import {
    DEFAULT_SORT,
    getSettings,
    ESortOrder,
    ETimerHistoryField,
    setSettings,
  } from '@/api/settings.ts';
  import TimersHistoryCellSort from '@/view/components/TimersHistoryCellSort.svelte';
  import TimersClearHistory from '@/view/components/TimersClearHistory.svelte';
  import { compareByFieldOrder } from '@/api/comparator.ts';

  export let caption: string;
  export let metrics: TSetTimerHistory[];
  export let clearTimeoutHistory: TClearTimerHistory[] | null;
  export let clearIntervalHistory: TClearTimerHistory[] | null;

  let field: ETimerHistoryField = DEFAULT_SORT.timersHistoryField;
  let order: ESortOrder = DEFAULT_SORT.timersHistoryOrder;
  let dialog: HTMLDialogElement | null = null;

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

  function onShowRegressor(regressorId: string | null) {
    timersClearHistoryMetric = null;
    if (!dialog || !regressorId) {
      return;
    }

    let record = clearTimeoutHistory?.find((r) => r.traceId === regressorId);
    record ??= clearIntervalHistory?.find((r) => r.traceId === regressorId);
    if (!record) {
      return;
    }

    timersClearHistoryMetric = [record];

    dialog.showModal();
    document.addEventListener('keydown', onKeyboardEvent);
  }
</script>

<dialog bind:this={dialog}>
  {#if timersClearHistoryMetric}
    <div class="header">
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
        {:else if metric.canceledByTraceId}
          <a
            role="button"
            title="Canceled by&mldr;"
            href="void(0)"
            on:click|preventDefault={() =>
              void onShowRegressor(metric.canceledByTraceId)}
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
      flex-direction: row-reverse;
      margin-bottom: 0.5rem;

      .close-icon {
        text-decoration: none;
      }
    }
  }
</style>
