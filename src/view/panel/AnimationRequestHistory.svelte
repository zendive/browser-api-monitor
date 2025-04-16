<script lang="ts">
  import type {
    TCancelAnimationFrameHistory,
    TRequestAnimationFrameHistory,
  } from '../../wrapper/AnimationWrapper.ts';
  import {
    DEFAULT_SORT_RAF,
    ESortOrder,
    getSettings,
    setSettings,
  } from '../../api/settings.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from '../components/Variable.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import FrameSensitiveTime from './components/FrameSensitiveTime.svelte';
  import TraceBreakpoint from './components/TraceBreakpoint.svelte';
  import Dialog from '../components/Dialog.svelte';
  import Alert from '../components/Alert.svelte';
  import AnimationCancelHistory from './AnimationCancelHistory.svelte';
  import TraceBypass from './components/TraceBypass.svelte';
  import CancelableCallMetric from './components/CancelableCallMetric.svelte';
  import CallstackCell from './components/CallstackCell.svelte';

  let {
    rafHistory,
    cafHistory,
    caption = '',
  }: {
    rafHistory: TRequestAnimationFrameHistory[];
    cafHistory: TCancelAnimationFrameHistory[] | null;
    caption: string;
  } = $props();
  let sortField = $state(DEFAULT_SORT_RAF.field);
  let sortOrder = $state(DEFAULT_SORT_RAF.order);
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let sortedMetrics = $derived.by(() =>
    rafHistory.toSorted(compareByFieldOrder(sortField, sortOrder))
  );

  getSettings().then((settings) => {
    sortField = settings.sortRequestAnimationFrame.field;
    sortOrder = settings.sortRequestAnimationFrame.order;
  });

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortField = <keyof TRequestAnimationFrameHistory> _field;
    sortOrder = _order;

    setSettings({
      sortRequestAnimationFrame: {
        field: $state.snapshot(sortField),
        order: $state.snapshot(sortOrder),
      },
    });
  }

  let cafHistoryMetrics: TCancelAnimationFrameHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!dialogEl || !alertEl || !regressors?.length) {
      return;
    }

    for (let n = regressors.length - 1; n >= 0; n--) {
      const traceId = regressors[n];
      let record = cafHistory?.find((r) => r.traceId === traceId);
      if (record) {
        cafHistoryMetrics.push(record);
      }
    }

    if (cafHistoryMetrics.length) {
      dialogEl.show();
    } else {
      alertEl.show();
    }
  }

  function onCloseDialog() {
    cafHistoryMetrics.splice(0);
  }
</script>

<Dialog
  bind:this={dialogEl}
  eventClose={onCloseDialog}
  title="Places from which requestAnimationFrame with current callstack was prematurely canceled"
  description="The information is actual only on time of demand. Requires cancelAnimationFrame panel enabled."
>
  <AnimationCancelHistory
    caption="Canceled by"
    cafHistory={$state.snapshot(cafHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires cancelAnimationFrame panel enabled
</Alert>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={rafHistory.length} />]
      </th>
      <th class="ta-r">
        <SortableColumn
          field="selfTime"
          currentField={sortField}
          currentFieldOrder={sortOrder}
          eventChangeSorting={onChangeSort}
        >Self</SortableColumn>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
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
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CallstackCell
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-r"><FrameSensitiveTime value={metric.selfTime} /></td>
        <td class="ta-c">{metric.cps || undefined}</td>
        <td class="ta-c">
          <CancelableCallMetric
            calls={metric.calls}
            canceledCounter={metric.canceledCounter}
            canceledByTraceIds={metric.canceledByTraceIds}
            onClick={onFindRegressors}
          />
        </td>
        <td class="ta-c"><Variable value={metric.handler} /></td>
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
