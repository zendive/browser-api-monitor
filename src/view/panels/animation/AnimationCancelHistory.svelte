<script lang="ts">
  import {
    CafFacts,
    type TCancelAnimationFrameHistory,
  } from '../../../wrapper/AnimationWrapper.ts';
  import {
    ESortOrder,
    saveLocalStorage,
  } from '../../../api/storage/storage.local.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import Variable from '../../shared/Variable.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';

  let {
    cafHistory,
    caption = '',
  }: { cafHistory: TCancelAnimationFrameHistory[]; caption?: string } =
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
    sortCancelAnimationFrame.field =
      <keyof TCancelAnimationFrameHistory> field;
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
        {caption} Callstack [<Variable value={cafHistory.length} />]
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
        <td class="ta-c">
          <CellFacts facts={metric.facts} factsMap={CafFacts} />
        </td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td class="ta-c">{metric.handler}</td>
        <td><CellBypass traceId={metric.traceId} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
