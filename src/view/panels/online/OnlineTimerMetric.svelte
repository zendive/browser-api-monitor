<script lang="ts">
  import type { IOnlineTimerMetrics } from '../../../wrapper/TimerWrapper.ts';
  import { delayTooltip } from '../../shared/util.ts';
  import CellCallstack from '../shared/CellCallstack.svelte';
  import { postTimerCommand } from '../../../state/config.state.svelte.ts';

  let { metric }: { metric: IOnlineTimerMetrics } = $props();
</script>

<tr class="t-zebra">
  <td class="wb-all w-full">
    <CellCallstack
      trace={metric.trace}
      traceDomain={metric.traceDomain}
    />
  </td>
  <td class="ta-c">
    <a
      href="."
      role="button"
      title="Clear"
      onclick={(e) => {
        e.preventDefault();
        postTimerCommand(metric.type, metric.handler);
      }}
    >{metric.handler}</a>
  </td>
  <td class="ta-r" title={delayTooltip(metric.delay)}>{metric.delay}</td>
</tr>

<style lang="scss">
  a:hover {
    text-decoration: line-through;
  }
</style>
