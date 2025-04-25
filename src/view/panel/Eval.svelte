<script lang="ts">
  import {
    EvalFact,
    type TEvalHistory,
  } from '../../wrapper/EvalWrapper.ts';
  import Variable from '../components/Variable.svelte';
  import FrameSensitiveTime from './components/FrameSensitiveTime.svelte';
  import TraceBreakpoint from './components/TraceBreakpoint.svelte';
  import TraceBypass from './components/TraceBypass.svelte';
  import CallstackCell from './components/CallstackCell.svelte';
  import type { TFactsMap } from '../../wrapper/Fact.ts';
  import FactsCell from './components/FactsCell.svelte';

  let { evalHistory }: { evalHistory: TEvalHistory[] | null } = $props();
  const EvalFacts: TFactsMap = new Map([
    [
      EvalFact.USES_GLOBAL_SCOPE,
      {
        tag: 'G',
        details:
          'Had access to global scope (local scope usage has not been detected)',
      },
    ],
    [
      EvalFact.USES_LOCAL_SCOPE,
      {
        tag: 'L',
        details:
          'Threw an error while trying to get value of local scope variable (return value is unreliable)',
      },
    ],
  ]);

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
            <CallstackCell
              trace={metric.trace}
              traceDomain={metric.traceDomain}
            />
          </td>
          <td class="ta-r">
            <FrameSensitiveTime value={metric.selfTime} />
          </td>
          <td class="ta-c">
            <FactsCell facts={metric.facts} factsMap={EvalFacts} />
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
          <td><TraceBypass traceId={metric.traceId} /></td>
          <td><TraceBreakpoint traceId={metric.traceId} /></td>
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
