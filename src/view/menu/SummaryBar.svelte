<script lang="ts">
  import { panelsArray2Map } from '../../api/storage/storage.local.ts';
  import SummaryBarItem from './SummaryBarItem.svelte';
  import { useConfigState } from '../../state/config.state.svelte.ts';
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';

  const ts = useTelemetryState();
  const config = useConfigState();
  let panels = $derived.by(() => panelsArray2Map(config.panels));
  let showActiveTimers = $derived.by(() =>
    (panels.setTimeout.wrap && panels.clearTimeout.wrap) ||
    (panels.setInterval.wrap && panels.clearInterval.wrap)
  );
</script>

{#if ts.telemetry && panels.callsSummary.visible}
  <nav class="summary">
    {#if panels.media.visible}
      <SummaryBarItem
        label="Media"
        navSelector="Videos|Audios"
        visible={true}
        count={ts.telemetry.media.total}
      />
    {/if}

    {#if showActiveTimers}
      <SummaryBarItem
        label="Active Timers"
        navSelector="Active"
        visible={panels.activeTimers.visible}
        count={ts.telemetry.onlineTimers.length}
      />
    {/if}

    {#if panels.worker.wrap}
      <SummaryBarItem
        label="Worker"
        navSelector="Worker"
        visible={panels.worker.visible}
        count={ts.telemetry.worker.totalOnline}
      />
    {/if}

    {#if panels.scheduler.wrap}
      <SummaryBarItem
        label="s.pT"
        tooltip="scheduler.postTask"
        navSelector="scheduler.postTask"
        visible={panels.scheduler.visible}
        count={ts.telemetry.scheduler.postTask?.length || 0}
      />
    {/if}

    {#if panels.scheduler.wrap}
      <SummaryBarItem
        label="s.y"
        tooltip="scheduler.yield"
        navSelector="scheduler.yield"
        visible={panels.scheduler.visible}
        count={ts.telemetry.scheduler.yield?.length || 0}
      />
    {/if}

    {#if panels.eval.wrap}
      <SummaryBarItem
        label="eval"
        navSelector="Eval"
        visible={panels.eval.visible}
        count={ts.telemetry.callCounter.eval}
      />
    {/if}

    {#if panels.setTimeout.wrap}
      <SummaryBarItem
        label="sT"
        tooltip="setTimeout"
        navSelector="setTimeout"
        visible={panels.setTimeout.visible}
        count={ts.telemetry.callCounter.setTimeout}
      />
    {/if}

    {#if panels.clearTimeout.wrap}
      <SummaryBarItem
        label="cT"
        tooltip="clearTimeout"
        navSelector="clearTimeout"
        visible={panels.clearTimeout.visible}
        count={ts.telemetry.callCounter.clearTimeout}
      />
    {/if}

    {#if panels.setInterval.wrap}
      <SummaryBarItem
        label="sI"
        tooltip="setInterval"
        navSelector="setInterval"
        visible={panels.setInterval.visible}
        count={ts.telemetry.callCounter.setInterval}
      />
    {/if}

    {#if panels.clearInterval.wrap}
      <SummaryBarItem
        label="cI"
        tooltip="clearInterval"
        navSelector="clearInterval"
        visible={panels.clearInterval.visible}
        count={ts.telemetry.callCounter.clearInterval}
      />
    {/if}

    {#if panels.requestAnimationFrame.wrap}
      <SummaryBarItem
        label="rAF"
        tooltip="requestAnimationFrame"
        navSelector="requestAnimationFrame"
        visible={panels.requestAnimationFrame.visible}
        count={ts.telemetry.callCounter.requestAnimationFrame}
      />
    {/if}

    {#if panels.cancelAnimationFrame.wrap}
      <SummaryBarItem
        label="cAF"
        tooltip="cancelAnimationFrame"
        navSelector="cancelAnimationFrame"
        visible={panels.cancelAnimationFrame.visible}
        count={ts.telemetry.callCounter.cancelAnimationFrame}
      />
    {/if}

    {#if panels.requestIdleCallback.wrap}
      <SummaryBarItem
        label="rIC"
        tooltip="requestIdleCallback"
        navSelector="requestIdleCallback"
        visible={panels.requestIdleCallback.visible}
        count={ts.telemetry.callCounter.requestIdleCallback}
      />
    {/if}

    {#if panels.cancelIdleCallback.wrap}
      <SummaryBarItem
        label="cIC"
        tooltip="cancelIdleCallback"
        navSelector="cancelIdleCallback"
        visible={panels.cancelIdleCallback.visible}
        count={ts.telemetry.callCounter.cancelIdleCallback}
      />
    {/if}
  </nav>
{/if}

<style lang="scss">
  .summary {
    display: flex;
    flex-wrap: wrap;
    flex-grow: 1;
    align-items: center;
    border-bottom: 1px solid var(--border);
  }
</style>
