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
  import { TerminatorsPopoverHelper } from '../shared/TerminatorPopoverHelper.svelte.ts';

  let {
    ricHistory,
    cicHistory = null,
    caption = '',
  }: {
    ricHistory: IRequestIdleCallbackHistory[];
    cicHistory: ICancelIdleCallbackHistory[] | null;
    caption: string;
  } = $props();
  const popoverId = $derived.by(() => `${caption}_popover_group`);
  const { sortRequestIdleCallback } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    ricHistory.toSorted(
      compareByFieldOrder(
        sortRequestIdleCallback.field,
        sortRequestIdleCallback.order,
      ),
    )
  );
  const tph = new TerminatorsPopoverHelper();
  const terminators = $derived.by(() => {
    if (!tph.traceId) return;

    const metric = ricHistory.find((r) => r.traceId === tph.traceId);
    if (!metric || !metric.canceledByTraceIds?.length) return;

    return cicHistory?.filter((r) =>
      metric.canceledByTraceIds?.includes(r.traceId)
    );
  });

  function updateSort(
    field: keyof IRequestIdleCallbackHistory,
    order: ESortOrder,
  ) {
    sortRequestIdleCallback.field = field;
    sortRequestIdleCallback.order = order;
    saveLocalStorage({ sortRequestIdleCallback });
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
      <IdleCallbackCancelHistory
        caption="Terminated by"
        cicHistory={terminators}
      />
    {:else}
      Requires cancelIdleCallback panel enabled
    {/if}
  </div>
{/if}

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="firstSeen"
          update={updateSort}
        >
          {caption} [<Variable value={ricHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">didTimeout</th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="selfTime"
          update={updateSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="facts"
          update={updateSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="handler"
          update={updateSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          sort={sortRequestIdleCallback}
          by="delay"
          update={updateSort}
        >Timeout</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestIdleCallback}
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
      <IdleCallbackRequestHistoryMetric
        {metric}
        {popoverId}
        {tph}
      />
    {/each}
  </tbody>
</table>
