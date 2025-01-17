<script lang="ts">
  import type {
    TClearTimerHistory,
    TSetTimerHistory,
  } from '../../api/wrappers.ts';
  import {
    DEFAULT_SORT_SET_TIMERS,
    getSettings,
    setSettings,
    ESortOrder,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { CALLED_ABORTED_TOOLTIP } from '../../api/const.ts';
  import { delayTitle } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import SortableColumn from './SortableColumn.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import Dialog from './Dialog.svelte';
  import Alert from './Alert.svelte';
  import FrameSensitiveTime from './FrameSensitiveTime.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';

  let {
    metrics,
    clearTimeoutHistory,
    clearIntervalHistory,
    caption,
  }: {
    metrics: TSetTimerHistory[];
    clearTimeoutHistory: TClearTimerHistory[] | null;
    clearIntervalHistory: TClearTimerHistory[] | null;
    caption?: string;
  } = $props();
  let sortField = $state(DEFAULT_SORT_SET_TIMERS.field);
  let sortOrder = $state(DEFAULT_SORT_SET_TIMERS.order);
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let sortedMetrics = $derived.by(() =>
    metrics.sort(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortSetTimers.field;
    sortOrder = settings.sortSetTimers.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TSetTimerHistory>_field;
    sortOrder = _order;

    setSettings({
      sortSetTimers: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
    });
  }

  let clearTimerHistoryMetrics: TClearTimerHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = clearTimeoutHistory?.find((r) => r.traceId === traceId);

      if (record) {
        clearTimerHistoryMetrics.push(record);
      }

      record = clearIntervalHistory?.find((r) => r.traceId === traceId);
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
  eventClose={onCloseDialog}
  title="Places from which timer with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. For full coverage - requires both clearTimeout and clearInterval panels enabled."
>
  <TimersClearHistory
    caption="Canceled by"
    metrics={$state.snapshot(clearTimerHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires both clearTimeout and clearInterval panels enabled
</Alert>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption}
    <Variable value={metrics.length} />
  </caption>
  <tbody>
    <tr>
      <th title="Breakpoint">BP</th>
      <th class="w-full">Callstack</th>
      <th class="ta-r">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Self</SortableColumn
        >
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Called</SortableColumn
        >
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Handler</SortableColumn
        >
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Delay</SortableColumn
        >
      </th>
      <th>
        <SortableColumn
          field="online"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}>Set</SortableColumn
        >
      </th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td><TraceBreakpoint traceId={metric.traceId} /></td>
        <td class="wb-all">
          <TraceDomain traceDomain={metric.traceDomain} />
          <Trace trace={metric.trace} />
        </td>
        <td class="ta-r">
          <FrameSensitiveTime value={metric.selfTime} />
        </td>
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
        <td class="ta-c"><Variable value={metric.handler} /></td>
        <td class="ta-r" title={delayTitle(metric.delay)}>{metric.delay}</td>
        <td class="ta-r">
          {#if metric.online}
            <Variable value={metric.online} />
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
