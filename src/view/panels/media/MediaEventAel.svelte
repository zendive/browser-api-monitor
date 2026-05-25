<script lang="ts">
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import type { IMediaAelMetric } from '../../../wrapper/MediaWrapper.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';

  let { metrics }: { metrics: IMediaAelMetric[] } = $props();
  const { sortMediaAel } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(compareByFieldOrder(
      sortMediaAel.field,
      sortMediaAel.order,
    ))
  );

  function updateSort(field: keyof IMediaAelMetric, order: ESortOrder) {
    sortMediaAel.field = field;
    sortMediaAel.order = order;
    saveLocalStorage({ sortMediaAel });
  }
</script>

{#if sortedMetrics.length}
  <table>
    <thead>
      <tr>
        <th class="w-full">
          <ColumnSortable
            sort={sortMediaAel}
            by="firstSeen"
            update={updateSort}
          >
            addEventListener [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortMediaAel}
            by="eventSelfTime"
            update={updateSort}
          >Self</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortMediaAel}
            by="events"
            update={updateSort}
          >Events</ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortMediaAel}
            by="calls"
            update={updateSort}
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
          <td class="ta-l wb-all">
            <CellCallstack trace={metric.trace} />
          </td>
          <td class="ta-r">
            <CellSelfTime time={metric.eventSelfTime} />
          </td>
          <td class="ta-c"><Variable value={metric.events} /></td>
          <td class="ta-c" title="&lt;called&gt; [&lt;removed&gt;]">
            <Variable value={metric.calls} />
            {#if metric.canceledCounter}
              [<Variable value={metric.canceledCounter} />]
            {/if}
          </td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
