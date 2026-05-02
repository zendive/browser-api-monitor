<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import TimersSetHistoryMetric from './TimersSetHistoryMetric.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import {
    type ETimerType,
    type IClearTimerHistory,
    type ISetTimerHistory,
  } from '../../../wrapper/TimerWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { TerminatorsPopoverHelper } from '../shared/TerminatorPopoverHelper.svelte.ts';

  let {
    setTimerHistory,
    clearTimeoutHistory,
    clearIntervalHistory,
    timerType,
    caption,
  }: {
    setTimerHistory: ISetTimerHistory[];
    clearTimeoutHistory: IClearTimerHistory[] | null;
    clearIntervalHistory: IClearTimerHistory[] | null;
    timerType: ETimerType;
    caption: string;
  } = $props();
  const popoverId = $derived.by(() => `${caption}_popover_group`);
  const { sortSetTimers } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    setTimerHistory.toSorted(
      compareByFieldOrder(sortSetTimers.field, sortSetTimers.order),
    )
  );
  const tph = new TerminatorsPopoverHelper();
  const terminators = $derived.by(() => {
    if (!tph.traceId) return;

    const metric = setTimerHistory.find((r) => r.traceId === tph.traceId);
    if (!metric || !metric.canceledByTraceIds?.length) return;

    const rv = clearTimeoutHistory?.filter(
      (r) => metric.canceledByTraceIds?.includes(r.traceId),
    ) || [];

    return rv.concat(
      clearIntervalHistory?.filter(
        (r) => metric.canceledByTraceIds?.includes(r.traceId),
      ) || [],
    );
  });

  function onChangeSort(field: string, order: ESortOrder) {
    sortSetTimers.field = <keyof ISetTimerHistory> field;
    sortSetTimers.order = order;

    saveLocalStorage({
      sortSetTimers: $state.snapshot(sortSetTimers),
    });
  }
</script>

{#if tph.traceId}
  <div
    id={popoverId}
    popover="hint"
    class="popover-terminators"
    class:-empty={terminators?.length === 0}
    ontoggle={tph.toggle}
  >
    {#if terminators?.length}
      <TimersClearHistory
        caption="Terminated by"
        clearTimerHistory={terminators}
      />
    {:else}
      Requires clearTimeout and clearInterval panels enabled
    {/if}
  </div>
{/if}

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
      <TimersSetHistoryMetric {metric} {timerType} {popoverId} {tph} />
    {/each}
  </tbody>
</table>
