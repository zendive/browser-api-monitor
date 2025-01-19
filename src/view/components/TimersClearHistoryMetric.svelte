<script lang="ts">
  import type { TClearTimerHistory } from '../../api/wrappers.ts';
  import { delayTitle } from '../../api/time.ts';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import Variable from './Variable.svelte';
  import TraceBreakpoint from './TraceBreakpoint.svelte';
  import TraceBypass from './TraceBypass.svelte';

  let { metric }: { metric: TClearTimerHistory } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all">
    <TraceDomain traceDomain={metric.traceDomain} />
    <Trace trace={metric.trace} />
  </td>
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c"><Variable value={metric.handler} /></td>
  <td class="ta-r" title={delayTitle(metric.delay)}>{metric.delay}</td>
  <td><TraceBypass traceId={metric.traceId} /></td>
  <td><TraceBreakpoint traceId={metric.traceId} /></td>
</tr>
