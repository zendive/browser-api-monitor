<script lang="ts">
  import type {
    IClearTimerHistory,
    ISetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import TimersSetHistoryMetric from './TimersSetHistoryMetric.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import Dialog from '../../shared/Dialog.svelte';
  import Alert from '../../shared/Alert.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';

  let {
    setTimerHistory,
    clearTimeoutHistory,
    clearIntervalHistory,
    caption,
  }: {
    setTimerHistory: ISetTimerHistory[];
    clearTimeoutHistory: IClearTimerHistory[] | null;
    clearIntervalHistory: IClearTimerHistory[] | null;
    caption?: string;
  } = $props();
  const { sortSetTimers } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    setTimerHistory.toSorted(
      compareByFieldOrder(sortSetTimers.field, sortSetTimers.order),
    )
  );
  let dialogEl: Dialog;
  let alertEl: Alert;
  let clearTimerHistoryMetrics: IClearTimerHistory[] = $state([]);

  function onChangeSort(field: string, order: ESortOrder) {
    sortSetTimers.field = <keyof ISetTimerHistory> field;
    sortSetTimers.order = order;

    saveLocalStorage({
      sortSetTimers: $state.snapshot(sortSetTimers),
    });
  }

  function onFindRegressors(regressors: string[] | null) {
    if (!regressors?.length) {
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
  title="Places from which timer with current callstack was prematurely cancelled"
  description="The information is actual only on time of demand. For full coverage - requires clearTimeout and/or clearInterval panels enabled."
>
  <TimersClearHistory
    caption="Cancelled by"
    clearTimerHistory={$state.snapshot(clearTimerHistoryMetrics)}
  />
</Dialog>

<Alert bind:this={alertEl} title="Attention">
  Requires clearTimeout and/or clearInterval panels enabled
</Alert>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          field="firstSeen"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >
          {caption} [<Variable value={setTimerHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="selfTime"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          field="delay"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Delay</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="online"
          currentField={sortSetTimers.field}
          currentFieldOrder={sortSetTimers.order}
          eventChangeSorting={onChangeSort}
        >Set</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <TimersSetHistoryMetric {metric} {onFindRegressors} />
    {/each}
  </tbody>
</table>
