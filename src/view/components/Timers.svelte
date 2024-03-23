<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import ActiveTimers from './ActiveTimers.svelte';
  import TimersHistory from './TimersHistory.svelte';

  export let metrics: TMetrics['wrapperMetrics'];
</script>

{#if metrics.onlineIntervals.length}
  <ActiveTimers
    caption="Active Intervals"
    bind:metrics={metrics.onlineIntervals}
  />
{/if}

{#if metrics.onlineTimeouts.length}
  <ActiveTimers
    caption="Active Timeouts"
    bind:metrics={metrics.onlineTimeouts}
  />
{/if}

{#if metrics.setTimeoutHistory.length}
  <TimersHistory
    caption="setTimeout History"
    bind:metrics={metrics.setTimeoutHistory}
  />
{/if}

{#if metrics.clearTimeoutHistory.length}
  <TimersHistory
    caption="clearTimeout History"
    bind:metrics={metrics.clearTimeoutHistory}
  />
{/if}

{#if metrics.setIntervalHistory.length}
  <TimersHistory
    caption="setInterval History"
    bind:metrics={metrics.setIntervalHistory}
  />
{/if}

{#if metrics.clearIntervalHistory.length}
  <TimersHistory
    caption="clearInterval History"
    bind:metrics={metrics.clearIntervalHistory}
  />
{/if}
