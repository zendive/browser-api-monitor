<script lang="ts">
  import type { TMetrics } from '@/cs-main';
  import ActiveTimers from './ActiveTimers.svelte';
  import TimersHistory from './TimersHistory.svelte';

  export let metrics: TMetrics['timeMetrics'];
</script>

<section>
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
