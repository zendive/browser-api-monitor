<script lang="ts">
  import {
    type IPostTask,
    PostTaskFacts,
  } from '../../../wrapper/SchedulerWrapper.ts';
  import { delayTooltip } from '../../../devtoolsPanelUtil.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellFacts from '../shared/CellFacts.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';

  let { metrics }: {
    metrics: IPostTask[];
  } = $props();
</script>

<table data-navigation-tag="scheduler.postTask">
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        scheduler.postTask Callstack [<Variable value={metrics.length} />]
      </th>
      <th class="ta-c">Self</th>
      <th class="ta-c">priority</th>
      <th class="ta-c"><span class="icon -facts"></span></th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">Called</th>
      <th class="ta-r">Delay</th>
      <th class="ta-c">Set</th>
      <th title="Bypass"><span class="icon -bypass"></span></th>
      <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
    </tr>
  </thead>
  <tbody>
    {#each metrics as metric (metric.traceId)}
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
        <td class="ta-c">{metric.eventsCps || undefined}</td>
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
