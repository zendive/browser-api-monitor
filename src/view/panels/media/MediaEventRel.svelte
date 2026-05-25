<script lang="ts">
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import ColumnSortable from '../shared/ColumnSortable.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import {
    type IMediaRelMetric,
    MediaRelFacts,
  } from '../../../wrapper/MediaWrapper.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';

  let { metrics }: { metrics: IMediaRelMetric[] } = $props();
  const { sortMediaRel } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(compareByFieldOrder(
      sortMediaRel.field,
      sortMediaRel.order,
    ))
  );

  function updateSort(field: keyof IMediaRelMetric, order: ESortOrder) {
    sortMediaRel.field = field;
    sortMediaRel.order = order;
    saveLocalStorage({ sortMediaRel });
  }
</script>

{#if sortedMetrics.length}
  <table>
    <thead>
      <tr>
        <th class="w-full">
          <ColumnSortable
            sort={sortMediaRel}
            by="firstSeen"
            update={updateSort}
          >
            removeEventListener [<Variable value={sortedMetrics.length} />]
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortMediaRel}
            by="facts"
            update={updateSort}
          >
            <span class="icon -facts"></span>
          </ColumnSortable>
        </th>
        <th class="ta-c">
          <ColumnSortable
            sort={sortMediaRel}
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
          <td class="ta-c">
            <CellFacts
              facts={metric.facts}
              factsMap={MediaRelFacts}
            />
          </td>
          <td class="ta-c"><Variable value={metric.calls} /></td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}
