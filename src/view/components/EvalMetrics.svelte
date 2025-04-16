<script lang="ts">
  import type { TEvalHistory } from '../../wrapper/EvalWrapper.ts';
  import Variable from './Variable.svelte';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import FrameSensitiveTime from './FrameSensitiveTime.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import TraceBypass from './TraceBypass.svelte';

  let { evalHistory }: { evalHistory: TEvalHistory[] | null } = $props();

  function dynamicValue(value: unknown): string {
    if (value === '⟪undefined⟫') {
      return '';
    } else if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  }
</script>

{#if evalHistory?.length}
  <table data-navigation-tag="Eval History">
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          Eval History Callstack [<Variable value={evalHistory.length} />]
        </th>
        <th class="ta-r">Self</th>
        <th>Called</th>
        <th>Code</th>
        <th>Returns</th>
        <th>Scope</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody>
      {#each evalHistory as metric (metric.traceId)}
        <tr class="t-zebra">
          <td class="wb-all">
            <TraceDomain traceDomain={metric.traceDomain} />
            <Trace trace={metric.trace} />
          </td>
          <td class="ta-r">
            <FrameSensitiveTime value={metric.selfTime} />
          </td>
          <td class="ta-c">
            <Variable value={metric.calls} />
          </td>
          <td class="limit-width">
            <div class="code">{dynamicValue(metric.code)}</div>
          </td>
          <td class="limit-width">
            <div class="code">{dynamicValue(metric.returnedValue)}</div>
          </td>
          <td>
            {#if metric.usesLocalScope}
              <span
                title="Throwed an error while trying to get local scope variables, return value is unreliable"
              >⁉️ LOCAL & GLOBAL</span>
            {:else}
              <span
                title="Had access to global scope (local scope usage has not been detected)"
              >GLOBAL</span>
            {/if}
          </td>
          <td><TraceBypass traceId={metric.traceId} /></td>
          <td><TraceBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style lang="scss">
  .limit-width {
    max-width: 12rem;
  }

  .code {
    max-width: 12rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
