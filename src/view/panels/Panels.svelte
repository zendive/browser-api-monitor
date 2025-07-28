<script lang="ts">
  import TimersClearHistory from './timers/TimersClearHistory.svelte';
  import AnimationRequestHistory from './animation/AnimationRequestHistory.svelte';
  import AnimationCancelHistory from './animation/AnimationCancelHistory.svelte';
  import Eval from './eval/Eval.svelte';
  import IdleCallbackCancelHistory from './idle/IdleCallbackCancelHistory.svelte';
  import TimersSetHistory from './timers/TimersSetHistory.svelte';
  import Media from './media/Media.svelte';
  import IdleCallbackRequestHistory from './idle/IdleCallbackRequestHistory.svelte';
  import Online from './online/Online.svelte';
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import Worker from './worker/Worker.svelte';
  import Scheduler from './scheduler/Scheduler.svelte';

  const ts = useTelemetryState();
</script>

{#if ts.telemetry}
  <Media media={ts.telemetry.media} />
  <Worker telemetry={ts.telemetry.worker} />
  <Scheduler telemetry={ts.telemetry.scheduler} />
  <Eval evalHistory={ts.telemetry.evalHistory} />
  <Online onlineTimers={ts.telemetry.onlineTimers} />

  {#if ts.telemetry.setTimeoutHistory?.length}
    <TimersSetHistory
      caption="setTimeout"
      setTimerHistory={ts.telemetry.setTimeoutHistory}
      clearTimeoutHistory={ts.telemetry.clearTimeoutHistory}
      clearIntervalHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}
  {#if ts.telemetry.clearTimeoutHistory?.length}
    <TimersClearHistory
      caption="clearTimeout"
      clearTimerHistory={ts.telemetry.clearTimeoutHistory}
    />
  {/if}

  {#if ts.telemetry.setIntervalHistory?.length}
    <TimersSetHistory
      caption="setInterval"
      setTimerHistory={ts.telemetry.setIntervalHistory}
      clearTimeoutHistory={ts.telemetry.clearTimeoutHistory}
      clearIntervalHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}
  {#if ts.telemetry.clearIntervalHistory?.length}
    <TimersClearHistory
      caption="clearInterval"
      clearTimerHistory={ts.telemetry.clearIntervalHistory}
    />
  {/if}

  {#if ts.telemetry.rafHistory?.length}
    <AnimationRequestHistory
      caption="requestAnimationFrame"
      rafHistory={ts.telemetry.rafHistory}
      cafHistory={ts.telemetry.cafHistory}
    />
  {/if}
  {#if ts.telemetry.cafHistory?.length}
    <AnimationCancelHistory
      caption="cancelAnimationFrame"
      cafHistory={ts.telemetry.cafHistory}
    />
  {/if}

  {#if ts.telemetry.ricHistory?.length}
    <IdleCallbackRequestHistory
      caption="requestIdleCallback"
      ricHistory={ts.telemetry.ricHistory}
      cicHistory={ts.telemetry.cicHistory}
    />
  {/if}
  {#if ts.telemetry.cicHistory?.length}
    <IdleCallbackCancelHistory
      caption="cancelIdleCallback"
      cicHistory={ts.telemetry.cicHistory}
    />
  {/if}
{/if}
