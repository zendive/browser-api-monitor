<script lang="ts">
  import {
    type ICancelAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import AnimationCancelHistoryMetric from './AnimationCancelHistoryMetric.svelte';

  let {
    cafHistory,
    caption = '',
  }: { cafHistory: ICancelAnimationFrameHistory[]; caption?: string } =
    $props();
  const { sortCancelAnimationFrame } = useConfigState();
  let sortedMetrics = $derived.by(() =>
    cafHistory.toSorted(
      compareByFieldOrder(
        sortCancelAnimationFrame.field,
        sortCancelAnimationFrame.order,
      ),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortCancelAnimationFrame.field = <keyof ICancelAnimationFrameHistory> field;
    sortCancelAnimationFrame.order = order;

    saveLocalStorage({
      sortCancelAnimationFrame: $state.snapshot(sortCancelAnimationFrame),
    });
  }
</script>

<table data-navigation-tag={caption}>
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          field="firstSeen"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >
          {caption} [<Variable value={cafHistory.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="facts"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          field="handler"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Handler</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <AnimationCancelHistoryMetric {metric} />
    {/each}
  </tbody>
</table>
