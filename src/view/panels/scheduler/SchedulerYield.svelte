<script lang="ts">
  import type { IYield } from '../../../wrapper/SchedulerWrapper.ts';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import Variable from '../../shared/Variable.svelte';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import ColumnSortable from '../shared/ColumnSortable.svelte';

  let { metrics }: { metrics: IYield[] } = $props();
  let { sortYield } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortYield.field, sortYield.order),
    )
  );

  function onChangeSort(field: string, order: ESortOrder) {
    sortYield.field = <keyof IYield> field;
    sortYield.order = order;

    saveLocalStorage({
      sortYield: $state.snapshot(sortYield),
    });
  }
</script>

<table data-navigation-tag="scheduler.yield">
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          field="firstSeen"
          currentField={sortYield.field}
          currentFieldOrder={sortYield.order}
          eventChangeSorting={onChangeSort}
        >
          scheduler.yield [<Variable value={sortedMetrics.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          field="calls"
          currentField={sortYield.field}
          currentFieldOrder={sortYield.order}
          eventChangeSorting={onChangeSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-c" title="Bypass"><span class="icon -bypass"></span></th>
      <th class="ta-c" title="Breakpoint">
        <span class="icon -breakpoint"></span>
      </th>
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
        <td class="ta-c">{metric.cps || undefined}</td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td><CellBypass traceId={metric.traceId} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
