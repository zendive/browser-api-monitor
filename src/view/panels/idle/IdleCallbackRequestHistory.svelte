<script lang="ts">
  import {
    type TCancelIdleCallbackHistory,
    type TRequestIdleCallbackHistory,
  } from '../../../wrapper/IdleWrapper.ts';
  import {
    ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';
  import Dialog from '../../shared/Dialog.svelte';
  import Alert from '../../shared/Alert.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import IdleCallbackRequestHistoryMetric from './IdleCallbackRequestHistoryMetric.svelte';

  let {
    ricHistory,
    cicHistory = null,
    caption = '',
  }: {
    ricHistory: TRequestIdleCallbackHistory[];
    cicHistory: TCancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();
  let dialogEl: Dialog;
  let alertEl: Alert;
  const { sortRequestIdleCallback } = useConfigState();
  let sortedMetrics = $derived.by(() =>
    ricHistory.toSorted(
      compareByFieldOrder(
        sortRequestIdleCallback.field,
        sortRequestIdleCallback.order,
      ),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortRequestIdleCallback.field =
      <keyof TRequestIdleCallbackHistory> field;
    sortRequestIdleCallback.order = order;

    saveLocalStorage({
      sortRequestIdleCallback: $state.snapshot(sortRequestIdleCallback),
    });
  }

  let cicHistoryMetrics: TCancelIdleCallbackHistory[] = $state([]);

  function onFindRegressors(regressors: string[] | null) {
    if (!regressors?.length) {
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
  title="Places from which requestIdleCallback with current callstack was prematurely cancelled"
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
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        {caption} Callstack [<Variable value={ricHistory.length} />]
      </th>
      <th class="ta-c">didTimeout</th>
      <th class="ta-c">
        <ColumnSortable
          field="selfTime"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          field="delay"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Timeout</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="online"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >Set</ColumnSortable>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <IdleCallbackRequestHistoryMetric
        {metric}
        {onFindRegressors}
      />
    {/each}
  </tbody>
</table>
