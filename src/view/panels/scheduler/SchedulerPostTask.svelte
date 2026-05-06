<script lang="ts">
  import {
    type IPostTask,
    PostTaskFacts,
  } from '../../../wrapper/SchedulerWrapper.ts';
  import { delayTooltip } from '../../shared/util.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import type { ESortOrder } from '../../../api/const.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import ColumnSortable from '../shared/ColumnSortable.svelte';

  let { metrics }: { metrics: IPostTask[] } = $props();
  const { sortPostTask } = useConfigState();
  const sortedMetrics = $derived.by(() =>
    metrics.toSorted(
      compareByFieldOrder(sortPostTask.field, sortPostTask.order),
    )
  );

  function updateSort(field: keyof IPostTask, order: ESortOrder) {
    sortPostTask.field = field;
    sortPostTask.order = order;
    saveLocalStorage({ sortPostTask });
  }
</script>

<table data-navigation-tag="scheduler.postTask">
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        <ColumnSortable
          sort={sortPostTask}
          by="firstSeen"
          update={updateSort}
        >
          scheduler.postTask [<Variable value={sortedMetrics.length} />]
        </ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortPostTask}
          by="selfTime"
          update={updateSort}
        >Self</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortPostTask}
          by="priority"
          update={updateSort}
        >Priority</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortPostTask}
          by="facts"
          update={updateSort}
        ><span class="icon -facts"></span></ColumnSortable>
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortPostTask}
          by="calls"
          update={updateSort}
        >Called</ColumnSortable>
      </th>
      <th class="ta-r">
        <ColumnSortable
          sort={sortPostTask}
          by="delay"
          update={updateSort}
        >Delay</ColumnSortable>
      </th>
      <th class="ta-c">
        <ColumnSortable
          sort={sortPostTask}
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
      <tr class="t-zebra">
        <td class="wb-all">
          <CellCallstack
            trace={metric.trace}
            traceDomain={metric.traceDomain}
          />
        </td>
        <td class="ta-r">
          <CellSelfTime time={metric.selfTime} />
        </td>
        <td class="ta-c">{metric.priority}</td>
        <td class="ta-c">
          <CellFacts facts={metric.facts} factsMap={PostTaskFacts} />
        </td>
        <td class="ta-c">{metric.cps || undefined}</td>
        <td class="ta-c" title="&lt;called&gt; [&lt;aborted&gt;]">
          <Variable value={metric.calls} />
          {#if metric.aborts}
            [<Variable value={metric.aborts} />]
          {/if}
        </td>
        <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
        <td class="ta-r">
          {#if metric.online}
            <Variable value={metric.online} />
          {/if}
        </td>
        <td><CellBypass traceId={metric.traceId} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
