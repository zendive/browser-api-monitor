<script lang="ts">
  import { postTimerCommand } from '../../../state/config.state.svelte.ts';
  import { delayTooltip } from '../../shared/util.ts';
  import { useTelemetryState } from '../../../state/telemetry.state.svelte.ts';
  import type { ETimerType } from '../../../wrapper/TimerWrapper.ts';

  let {
    traceId,
    timerType,
  }: {
    traceId: string;
    timerType: ETimerType;
  } = $props();
  const ts = useTelemetryState();
  const onlineMetrics = $derived.by(() => {
    return ts.telemetry?.onlineTimers.filter((o) =>
      o.traceId === traceId && o.type === timerType
    ) ||
      [];
  });
</script>

<table>
  <thead class="sticky-header">
    <tr>
      <th class="ta-c">Handler</th>
      <th class="ta-r">Delay</th>
    </tr>
  </thead>
  <tbody>
    {#each onlineMetrics as metric (metric.handler)}
      <tr class="t-zebra">
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
        <td class="ta-r" title={delayTooltip(metric.delay)}>
          {metric.delay}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style lang="scss">
  a:hover {
    text-decoration: line-through;
  }
</style>
