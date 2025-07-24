<script lang="ts">
  import { panelsArray2Map } from '../../api/storage/storage.local.ts';
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
      label="Media"
      navSelector="Videos|Audios"
      panel={panels.media}
      count={ts.telemetry.media.total}
    />

    <SummaryBarItem
      label="Worker"
      navSelector="Worker"
      panel={panels.worker}
      count={ts.telemetry.worker.totalOnline}
    />

    <SummaryBarItem
      label="eval"
      navSelector="Eval"
      panel={panels.eval}
      count={ts.telemetry.callCounter.eval}
    />

    <SummaryBarItem
      label="Active Timers"
      navSelector="Active"
      panel={panels.activeTimers}
      count={ts.telemetry.activeTimers}
    />

    <SummaryBarItem
      label="sT"
      tooltip="setTimeout"
      navSelector="setTimeout"
      panel={panels.setTimeout}
      count={ts.telemetry.callCounter.setTimeout}
    />

    <SummaryBarItem
      label="cT"
      tooltip="clearTimeout"
      navSelector="clearTimeout"
      panel={panels.clearTimeout}
      count={ts.telemetry.callCounter.clearTimeout}
    />

    <SummaryBarItem
      label="sI"
      tooltip="setInterval"
      navSelector="setInterval"
      panel={panels.setInterval}
      count={ts.telemetry.callCounter.setInterval}
    />

    <SummaryBarItem
      label="cI"
      tooltip="clearInterval"
      navSelector="clearInterval"
      panel={panels.clearInterval}
      count={ts.telemetry.callCounter.clearInterval}
    />

    <SummaryBarItem
      label="rAF"
      tooltip="requestAnimationFrame"
      navSelector="requestAnimationFrame"
      panel={panels.requestAnimationFrame}
      count={ts.telemetry.callCounter.requestAnimationFrame}
    />

    <SummaryBarItem
      label="cAF"
      tooltip="cancelAnimationFrame"
      navSelector="cancelAnimationFrame"
      panel={panels.cancelAnimationFrame}
      count={ts.telemetry.callCounter.cancelAnimationFrame}
    />

    <SummaryBarItem
      label="rIC"
      tooltip="requestIdleCallback"
      navSelector="requestIdleCallback"
      panel={panels.requestIdleCallback}
      count={ts.telemetry.callCounter.requestIdleCallback}
    />

    <SummaryBarItem
      label="cIC"
      tooltip="cancelIdleCallback"
      navSelector="cancelIdleCallback"
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
