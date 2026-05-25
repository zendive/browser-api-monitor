<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import TimersSetHistoryMetric from './TimersSetHistoryMetric.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import {
    ETimerType,
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

    const metric = setTimerHistory.find((v) => v.traceId === tph.traceId);
    if (!metric || !metric.canceledByTraceIds?.length) return;

    const cthMap: Map<string, IClearTimerHistory> = new Map();
    const cihMap: Map<string, IClearTimerHistory> = new Map();
    let rv: IClearTimerHistory[];

    clearTimeoutHistory?.forEach((v) => {
      if (metric.canceledByTraceIds?.includes(v.traceId)) {
        cthMap.set(v.traceId, v);
      }
    });
    clearIntervalHistory?.forEach((v) => {
      if (metric.canceledByTraceIds?.includes(v.traceId)) {
        cihMap.set(v.traceId, v);
      }
    });

    // deduplicate data when both sources share the same traceId
    if (timerType === ETimerType.TIMEOUT) {
      rv = Array.from(cthMap.values());
      cihMap.forEach((cihV) => {
        const cthV = cthMap.get(cihV.traceId);
        if (!cthV) {
          rv.push(cihV);
        }
      });
    } else {
      rv = Array.from(cihMap.values());
      cthMap.forEach((cthV) => {
        const cihV = cihMap.get(cthV.traceId);
        if (!cihV) {
          rv.push(cthV);
        }
      });
    }

    return rv;
  });

  function updateSort(field: keyof ISetTimerHistory, order: ESortOrder) {
    sortSetTimers.field = field;
    sortSetTimers.order = order;
    saveLocalStorage({ sortSetTimers });
  }
</script>

{#if tph.traceId}
  <div
    id={popoverId}
    popover="hint"
    class="metrics-popover"
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
          sort={sortSetTimers}
          by="firstSeen"
          update={updateSort}
        >
          {caption} [<Variable value={setTimerHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortSetTimers}
          by="selfTime"
          update={updateSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortSetTimers}
          by="facts"
          update={updateSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortSetTimers}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortSetTimers}
          by="handler"
          update={updateSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          sort={sortSetTimers}
          by="delay"
          update={updateSort}
        >Delay</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortSetTimers}
          by="online"
          update={updateSort}
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
