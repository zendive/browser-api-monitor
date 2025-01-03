<script lang="ts">
  import type { TClearTimerHistory } from '../../api/wrappers.ts';
  import Trace from './Trace.svelte';
  import TraceDomain from './TraceDomain.svelte';
  import Variable from './Variable.svelte';

  let { metric }: { metric: TClearTimerHistory } = $props();
</script>

<tr class="t-zebra">
  <td><TraceDomain traceDomain={metric.traceDomain} /></td>
  <td class="wb-all"><Trace trace={metric.trace} traceId={metric.traceId} /></td
  >
  <td class="ta-c"><Variable value={metric.calls} /></td>
  <td class="ta-c">{metric.handler}</td>
  <td class="ta-r">{metric.delay}</td>
</tr>
