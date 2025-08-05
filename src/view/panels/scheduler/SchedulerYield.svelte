<script lang="ts">
  import type { IYield } from '../../../wrapper/SchedulerWrapper.ts';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import Variable from '../../shared/Variable.svelte';

  let { metrics }: { metrics: IYield[] } = $props();
</script>

<table data-navigation-tag="scheduler.yield">
  <thead class="sticky-header">
    <tr>
      <th class="w-full">
        scheduler.yield Callstack [<Variable value={metrics.length} />]
      </th>
      <th class="ta-c" title="Calls per second">CPS</th>
      <th class="ta-c">Called</th>
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
        <td class="ta-c">{metric.cps || undefined}</td>
        <td class="ta-c"><Variable value={metric.calls} /></td>
        <td><CellBypass traceId={metric.traceId} /></td>
        <td><CellBreakpoint traceId={metric.traceId} /></td>
      </tr>
    {/each}
  </tbody>
</table>
