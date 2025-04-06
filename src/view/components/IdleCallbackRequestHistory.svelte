<script lang="ts">
  import type {
    TCancelIdleCallbackHistory,
    TRequestIdleCallbackHistory,
  } from '../../wrapper/IdleWrapper.ts';
  import {
    DEFAULT_SORT_RIC,
    ESortOrder,
    getSettings,
    setSettings,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import { msToHms } from '../../api/time.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';
  import Dialog from './Dialog.svelte';
  import Alert from './Alert.svelte';
  import SortableColumn from './SortableColumn.svelte';
  import FrameSensitiveTime from './FrameSensitiveTime.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import TraceBypass from './TraceBypass.svelte';
  import CancelableCallMetric from './CancelableCallMetric.svelte';

  let {
    ricHistory,
    cicHistory = null,
    caption = '',
  }: {
    ricHistory: TRequestIdleCallbackHistory[];
    cicHistory: TCancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();
  let sortField = $state(DEFAULT_SORT_RIC.field);
  let sortOrder = $state(DEFAULT_SORT_RIC.order);
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let sortedMetrics = $derived.by(() =>
    ricHistory.toSorted(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortRequestIdleCallback.field;
    sortOrder = settings.sortRequestIdleCallback.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TRequestIdleCallbackHistory> _field;
    sortOrder = _order;

    setSettings({
      sortRequestIdleCallback: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
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
  description="The information is actual only on time of demand. Requires cancelIdleCallback panel enabled."
>
  <IdleCallbackCancelHistory
    caption="Canceled by"
    cicHistory={$state.snapshot(cicHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires cancelIdleCallback panel enabled
</Alert>

<table data-navigation-tag={caption}>
  <caption class="bc-invert ta-l">
    {caption} <Variable value={ricHistory.length} />
  </caption>
  <tbody>
    <tr>
      <th class="w-full">Callstack</th>
      <th class="ta-c">didTimeout</th>
      <th class="ta-r">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Self</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th class="ta-r">
        <SortableColumn
          field="delay"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Delay</SortableColumn>
      </th>
      <th>
        <SortableColumn
          field="online"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Set</SortableColumn>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>

    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <TraceDomain traceDomain={metric.traceDomain} />
          <Trace trace={metric.trace} />
        </td>
        <td class="ta-c">{metric.didTimeout}</td>
        <td class="ta-r"><FrameSensitiveTime value={metric.selfTime} /></td>
        <td class="ta-c">
          <CancelableCallMetric
            calls={metric.calls}
            canceledCounter={metric.canceledCounter}
            canceledByTraceIds={metric.canceledByTraceIds}
            onClick={onFindRegressors}
          />
        </td>
        <td class="ta-c"><Variable value={metric.handler} /></td>
        <td class="ta-r" title={msToHms(metric.delay)}>{metric.delay}</td>
        <td class="ta-r">
          {#if metric.online}
            <Variable value={metric.online} />
          {/if}
        </td>
        <td><TraceBypass traceId={metric.traceId} /></td>
        <td><TraceBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
