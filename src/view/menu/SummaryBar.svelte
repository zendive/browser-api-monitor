<script lang="ts">
  import { panelsArray2Map } from '../../api/storage.local.ts';
  import SummaryBarItem from './SummaryBarItem.svelte';
  import { useConfigState } from '../../state/config.state.svelte.ts';
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';

  const ts = useTelemetryState();
  const config = useConfigState();
  let panels = $derived.by(() => panelsArray2Map(config.panels));
</script>

<div class="summary">
  {#if ts.telemetry && panels.callsSummary.visible}
    <SummaryBarItem
      label="eval"
      navSelector="Eval History"
      panel={panels.eval}
      count={ts.telemetry.callCounter.eval}
    />

    <SummaryBarItem
      label="Media"
      navSelector="Videos|Audios"
      panel={panels.media}
      count={ts.telemetry.media.total}
    />

    <SummaryBarItem
      label="Active Timers"
      navSelector="Active"
      panel={panels.activeTimers}
      count={ts.telemetry.activeTimers}
    />

    <SummaryBarItem
      label="setTimeout"
      navSelector="setTimeout History"
      panel={panels.setTimeout}
      count={ts.telemetry.callCounter.setTimeout}
    />

    <SummaryBarItem
      label="clearTimeout"
      navSelector="clearTimeout History"
      panel={panels.clearTimeout}
      count={ts.telemetry.callCounter.clearTimeout}
    />

    <SummaryBarItem
      label="setInterval"
      navSelector="setInterval History"
      panel={panels.setInterval}
      count={ts.telemetry.callCounter.setInterval}
    />

    <SummaryBarItem
      label="clearInterval"
      navSelector="clearInterval History"
      panel={panels.clearInterval}
      count={ts.telemetry.callCounter.clearInterval}
    />

    <SummaryBarItem
      label="RAF"
      tooltip="requestAnimationFrame"
      navSelector="requestAnimationFrame History"
      panel={panels.requestAnimationFrame}
      count={ts.telemetry.callCounter.requestAnimationFrame}
    />

    <SummaryBarItem
      label="CAF"
      tooltip="cancelAnimationFrame"
      navSelector="cancelAnimationFrame History"
      panel={panels.cancelAnimationFrame}
      count={ts.telemetry.callCounter.cancelAnimationFrame}
    />

    <SummaryBarItem
      label="RIC"
      tooltip="requestIdleCallback"
      navSelector="requestIdleCallback History"
      panel={panels.requestIdleCallback}
      count={ts.telemetry.callCounter.requestIdleCallback}
    />

    <SummaryBarItem
      label="CIC"
      tooltip="cancelIdleCallback"
      navSelector="cancelIdleCallback History"
      panel={panels.cancelIdleCallback}
      count={ts.telemetry.callCounter.cancelIdleCallback}
    />
  {/if}
</div>

<style lang="scss">
  .summary {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    align-items: center;
  }
</style>
