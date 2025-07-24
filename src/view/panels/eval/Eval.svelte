<script lang="ts">
  import {
    EvalFacts,
    type TEvalHistory,
  } from '../../../wrapper/EvalWrapper.ts';
  import Variable from '../../shared/Variable.svelte';
  import CellSelfTime from '../shared/CellSelfTime.svelte';
  import CellBreakpoint from '../shared/CellBreakpoint.svelte';
  import CellBypass from '../shared/CellBypass.svelte';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import CellFacts from '../shared/CellFacts.svelte';

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
  <table data-navigation-tag="Eval">
    <thead class="sticky-header">
      <tr>
        <th class="w-full">
          Eval Callstack [<Variable value={evalHistory.length} />]
        </th>
        <th class="ta-c">Self</th>
        <th class="ta-c" title="Facts"><span class="icon -facts"></span></th>
        <th>Called</th>
        <th>Code</th>
        <th>Returns</th>
        <th title="Bypass"><span class="icon -bypass"></span></th>
        <th title="Breakpoint"><span class="icon -breakpoint"></span></th>
      </tr>
    </thead>

    <tbody>
      {#each evalHistory as metric (metric.traceId)}
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
          <td class="ta-c">
            <CellFacts facts={metric.facts} factsMap={EvalFacts} />
          </td>
          <td class="ta-c">
            <Variable value={metric.calls} />
          </td>
          <td>
            <div class="code">{dynamicValue(metric.code)}</div>
          </td>
          <td>
            <div class="code">{dynamicValue(metric.returnedValue)}</div>
          </td>
          <td><CellBypass traceId={metric.traceId} /></td>
          <td><CellBreakpoint traceId={metric.traceId} /></td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style lang="scss">
  .code {
    max-width: 10rem;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
