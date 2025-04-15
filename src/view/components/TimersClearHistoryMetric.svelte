<script lang="ts">
  import {
    ClearTimerFact,
    type TClearTimerHistory,
  } from '../../wrapper/TimerWrapper.ts';
  import { msToHms } from '../../api/time.ts';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import Variable from './Variable.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import TraceBypass from './TraceBypass.svelte';
  import type { TFactsMap } from '../../wrapper/Fact.ts';
  import FactsCell from './FactsCell.svelte';

  let { metric }: { metric: TClearTimerHistory } = $props();
  const ClearTimerFacts: TFactsMap = new Map([
    [ClearTimerFact.NOT_FOUND, { tag: 'T', details: 'Timer not found' }],
    [ClearTimerFact.BAD_HANDLER, {
      tag: 'H',
      details: 'Handler is not a positive number',
    }],
  ]);
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <TraceDomain traceDomain={metric.traceDomain} />
    <Trace trace={metric.trace} />
  </td>
  <td class="ta-c">
    <FactsCell facts={metric.facts} factsMap={ClearTimerFacts} />
  </td>
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c"><Variable value={metric.handler} /></td>
  <td class="ta-r" title={msToHms(metric.delay)}>{metric.delay}</td>
  <td><TraceBypass traceId={metric.traceId} /></td>
  <td><TraceBreakpoint traceId={metric.traceId} /></td>
</tr>
