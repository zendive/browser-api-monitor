<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import AnimationCancelHistory from './AnimationCancelHistory.svelte';
  import AnimationRequestHistoryMetric from './AnimationRequestHistoryMetric.svelte';
  import type {
    ICancelAnimationFrameHistory,
    IRequestAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { TerminatorsPopoverHelper } from '../shared/TerminatorPopoverHelper.svelte.ts';

  let {
    rafHistory,
    cafHistory,
    caption = '',
  }: {
    rafHistory: IRequestAnimationFrameHistory[];
    cafHistory: ICancelAnimationFrameHistory[] | null;
    caption: string;
  } = $props();
  const popoverId = $derived.by(() => `${caption}_popover_group`);
  const { sortRequestAnimationFrame } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    rafHistory.toSorted(
      compareByFieldOrder(
        sortRequestAnimationFrame.field,
        sortRequestAnimationFrame.order,
      ),
    )
  );
  const tph = new TerminatorsPopoverHelper();
  const terminators = $derived.by(() => {
    if (!tph.traceId) return;

    const metric = rafHistory.find((r) => r.traceId === tph.traceId);
    if (!metric || !metric.canceledByTraceIds?.length) return;

    return cafHistory?.filter((r) =>
      metric.canceledByTraceIds?.includes(r.traceId)
    );
  });

  function updateSort(
    field: keyof IRequestAnimationFrameHistory,
    order: ESortOrder,
  ) {
    sortRequestAnimationFrame.field = field;
    sortRequestAnimationFrame.order = order;
    saveLocalStorage({ sortRequestAnimationFrame });
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
      <AnimationCancelHistory
        caption="Terminated by"
        cafHistory={terminators}
      />
    {:else}
      Requires cancelAnimationFrame panel enabled
    {/if}
  </div>
{/if}

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          sort={sortRequestAnimationFrame}
          by="firstSeen"
          update={updateSort}
        >
          {caption} [<Variable value={rafHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestAnimationFrame}
          by="selfTime"
          update={updateSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestAnimationFrame}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestAnimationFrame}
          by="handler"
          update={updateSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortRequestAnimationFrame}
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
      <AnimationRequestHistoryMetric
        {metric}
        {popoverId}
        {tph}
      />
    {/each}
  </tbody>
</table>
