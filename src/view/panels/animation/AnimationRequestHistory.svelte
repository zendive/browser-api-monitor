<script lang="ts">
  import type {
    TCancelAnimationFrameHistory,
    TRequestAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import {
    ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import Dialog from '../../shared/Dialog.svelte';
  import Alert from '../../shared/Alert.svelte';
  import AnimationCancelHistory from './AnimationCancelHistory.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCancelable from '../shared/CellCancelable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let {
    rafHistory,
    cafHistory,
    caption = '',
  }: {
    rafHistory: TRequestAnimationFrameHistory[];
    cafHistory: TCancelAnimationFrameHistory[] | null;
    caption: string;
  } = $props();
  const { sortRequestAnimationFrame } = useConfigState();
  let dialogEl: Dialog | null = null;
  let alertEl: Alert | null = null;
  let sortedMetrics = $derived.by(() =>
    rafHistory.toSorted(
      compareByFieldOrder(
        sortRequestAnimationFrame.field,
        sortRequestAnimationFrame.order,
      ),
    )
  );

  function onChangeSort(_field: string, _order: ESortOrder) {
    sortRequestAnimationFrame.field =
      <keyof TRequestAnimationFrameHistory> _field;
    sortRequestAnimationFrame.order = _order;

    saveLocalStorage({
      sortRequestAnimationFrame: $state.snapshot(sortRequestAnimationFrame),
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
      <th class="ta-c">
        <ColumnSortable
          field="selfTime"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th>
        <ColumnSortable
          field="online"
          currentField={sortRequestAnimationFrame.field}
          currentFieldOrder={sortRequestAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Set</ColumnSortable>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CellCallstack
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-r"><CellSelfTime time={metric.selfTime} /></td>
        <td class="ta-c">{metric.cps || undefined}</td>
        <td class="ta-c">
          <CellCancelable
            calls={metric.calls}
            canceledCounter={metric.canceledCounter}
            canceledByTraceIds={metric.canceledByTraceIds}
            onClick={onFindRegressors}
          />
        </td>
        <td class="ta-c">{metric.handler}</td>
        <td class="ta-r">
          {#if metric.online}
            <Variable value={metric.online} />
          {/if}
        </td>
        <td><CellBypass traceId={metric.traceId} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
