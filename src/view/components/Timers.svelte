<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import Variable from './Variable.svelte';
  import ActiveTimers from './ActiveTimers.svelte';
  import TimersHistory from './TimersHistory.svelte';

  export let callCounter: TMetrics['callCounter'];
  export let metrics: TMetrics['timeMetrics'];
</script>

<section>
  <div>
    <span
      ><strong>setTimeout</strong>: <Variable
        bind:value={callCounter.setTimeout}
      /></span
    >
    <span
      ><strong>clearTimeout</strong>: <Variable
        bind:value={callCounter.clearTimeout}
      /></span
    >
    <span
      ><strong>setInterval</strong>: <Variable
        bind:value={callCounter.setInterval}
      /></span
    >
    <span
      ><strong>clearInterval</strong>: <Variable
        bind:value={callCounter.clearInterval}
      /></span
    >
  </div>

  <ActiveTimers
    caption="Active Intervals"
    bind:metrics={metrics.onlineIntervals}
  />
  <ActiveTimers
    caption="Active Timeouts"
    bind:metrics={metrics.onlineTimeouts}
  />

  <TimersHistory
    caption="setTimeout History"
    bind:metrics={metrics.setTimeoutHistory}
  />
  <TimersHistory
    caption="clearTimeout History"
    bind:metrics={metrics.clearTimeoutHistory}
  />
  <TimersHistory
    caption="setInterval History"
    bind:metrics={metrics.setIntervalHistory}
  />
  <TimersHistory
    caption="clearInterval History"
    bind:metrics={metrics.clearIntervalHistory}
  />
</section>
