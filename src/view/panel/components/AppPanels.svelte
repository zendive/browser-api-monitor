<script lang="ts">
  import TimersClearHistory from '../TimersClearHistory.svelte';
  import AnimationRequestHistory from '../AnimationRequestHistory.svelte';
  import AnimationCancelHistory from '../AnimationCancelHistory.svelte';
  import Eval from '../Eval.svelte';
  import IdleCallbackCancelHistory from '../IdleCallbackCancelHistory.svelte';
  import TimersSetHistory from '../TimersSetHistory.svelte';
  import Media from '../Media.svelte';
  import IdleCallbackRequestHistory from '../IdleCallbackRequestHistory.svelte';
  import OnlineTimers from '../OnlineTimers.svelte';
  import { useTelemetryState } from '../../../state/telemetry.state.svelte.ts';

  const ts = useTelemetryState();
</script>

{#if ts.telemetry}
  <Eval evalHistory={ts.telemetry.evalHistory} />
  <Media media={ts.telemetry.media} />
  <OnlineTimers onlineTimers={ts.telemetry.onlineTimers} />

  {#if ts.telemetry.setTimeoutHistory?.length}
    <TimersSetHistory
      caption="setTimeout History"
      setTimerHistory={ts.telemetry.setTimeoutHistory}
      clearTimeoutHistory={ts.telemetry.clearTimeoutHistory}
      clearIntervalHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}
  {#if ts.telemetry.clearTimeoutHistory?.length}
    <TimersClearHistory
      caption="clearTimeout History"
      clearTimerHistory={ts.telemetry.clearTimeoutHistory}
    />
  {/if}

  {#if ts.telemetry.setIntervalHistory?.length}
    <TimersSetHistory
      caption="setInterval History"
      setTimerHistory={ts.telemetry.setIntervalHistory}
      clearTimeoutHistory={ts.telemetry.clearTimeoutHistory}
      clearIntervalHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}
  {#if ts.telemetry.clearIntervalHistory?.length}
    <TimersClearHistory
      caption="clearInterval History"
      clearTimerHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}

  {#if ts.telemetry.rafHistory?.length}
    <AnimationRequestHistory
      caption="requestAnimationFrame History"
      rafHistory={ts.telemetry.rafHistory}
      cafHistory={ts.telemetry.cafHistory}
    />
  {/if}
  {#if ts.telemetry.cafHistory?.length}
    <AnimationCancelHistory
      caption="cancelAnimationFrame History"
      cafHistory={ts.telemetry.cafHistory}
    />
  {/if}

  {#if ts.telemetry.ricHistory?.length}
    <IdleCallbackRequestHistory
      caption="requestIdleCallback History"
      ricHistory={ts.telemetry.ricHistory}
      cicHistory={ts.telemetry.cicHistory}
    />
  {/if}
  {#if ts.telemetry.cicHistory?.length}
    <IdleCallbackCancelHistory
      caption="cancelIdleCallback History"
      cicHistory={ts.telemetry.cicHistory}
    />
  {/if}
{/if}
