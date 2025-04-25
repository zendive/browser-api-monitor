<script lang="ts">
  import {
    CafFact,
    type TCancelAnimationFrameHistory,
  } from '../../wrapper/AnimationWrapper.ts';
  import { ESortOrder, saveLocalStorage } from '../../api/storage.local.ts';
  import { compareByFieldOrder } from '../../api/comparator.ts';
  import Variable from '../components/Variable.svelte';
  import SortableColumn from './components/SortableColumn.svelte';
  import TraceBreakpoint from './components/TraceBreakpoint.svelte';
  import TraceBypass from './components/TraceBypass.svelte';
  import type { TFactsMap } from '../../wrapper/Fact.ts';
  import FactsCell from './components/FactsCell.svelte';
  import CallstackCell from './components/CallstackCell.svelte';
  import { useConfigState } from '../../state/config.state.svelte.ts';

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
  const CafFacts: TFactsMap = new Map([
    [CafFact.NOT_FOUND, { tag: 'A', details: 'Animation not found' }],
    [CafFact.BAD_HANDLER, {
      tag: 'H',
      details: 'Handler is not a positive number',
    }],
  ]);

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
        <SortableColumn
          field="facts"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        ><span class="icon -facts"></span></SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="calls"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Called</SortableColumn>
      </th>
      <th class="ta-c">
        <SortableColumn
          field="handler"
          currentField={sortCancelAnimationFrame.field}
          currentFieldOrder={sortCancelAnimationFrame.order}
          eventChangeSorting={onChangeSort}
        >Handler</SortableColumn>
      </th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>

  <tbody>
    {#each sortedMetrics as metric (metric.traceId)}
      <tr class="t-zebra">
        <td class="wb-all">
          <CallstackCell
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-c">
          <FactsCell facts={metric.facts} factsMap={CafFacts} />
        </td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td class="ta-c">{metric.handler}</td>
        <td><TraceBypass traceId={metric.traceId} /></td>
        <td><TraceBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
