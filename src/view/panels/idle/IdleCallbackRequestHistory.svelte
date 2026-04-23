<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import IdleCallbackRequestHistoryMetric from './IdleCallbackRequestHistoryMetric.svelte';
  import {
    type ICancelIdleCallbackHistory,
    type IRequestIdleCallbackHistory,
  } from '../../../wrapper/IdleWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let {
    ricHistory,
    cicHistory = null,
    caption = '',
  }: {
    ricHistory: IRequestIdleCallbackHistory[];
    cicHistory: ICancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();
  const popoverId = $derived.by(() => `${caption}_terminators`);
  const { sortRequestIdleCallback } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    ricHistory.toSorted(
      compareByFieldOrder(
        sortRequestIdleCallback.field,
        sortRequestIdleCallback.order,
      ),
    )
  );
  let traceIdForTerminators: string | null = $state(null);
  const terminators = $derived.by(() => {
    if (!traceIdForTerminators) return;

    const metric = ricHistory.find((r) => r.traceId === traceIdForTerminators);
    if (!metric || !metric.canceledByTraceIds?.length) return;

    return cicHistory?.filter((r) =>
      metric.canceledByTraceIds?.includes(r.traceId)
    );
  });

  function showTerminatorsFor(traceId: string) {
    traceIdForTerminators = traceId;
  }

  function onTogglePopover(e: ToggleEvent) {
    if (e.newState === 'closed') {
      traceIdForTerminators = null;
    }
  }

  function onChangeSort(field: string, order: ESortOrder) {
    sortRequestIdleCallback.field = <keyof IRequestIdleCallbackHistory> field;
    sortRequestIdleCallback.order = order;

    saveLocalStorage({
      sortRequestIdleCallback: $state.snapshot(sortRequestIdleCallback),
    });
  }
</script>

<div
  id={popoverId}
  popover="hint"
  class="popover-terminators"
  class:-empty={terminators?.length === 0}
  ontoggle={onTogglePopover}
>
  {#if terminators?.length}
    <IdleCallbackCancelHistory
      caption="Terminated by"
      cicHistory={$state.snapshot(terminators)}
    />
  {:else}
    Requires cancelIdleCallback panel enabled
  {/if}
</div>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          field="firstSeen"
          currentField={sortRequestIdleCallback.field}
          currentFieldOrder={sortRequestIdleCallback.order}
          eventChangeSorting={onChangeSort}
        >
          {caption} [<Variable value={ricHistory.length} />]
        </ColumnSortable>
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
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <IdleCallbackRequestHistoryMetric
        {metric}
        {popoverId}
        {showTerminatorsFor}
      />
    {/each}
  </tbody>
</table>
