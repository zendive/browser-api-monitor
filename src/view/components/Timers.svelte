<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import { ETimerType, type TOnlineTimerMetrics } from '@/api/wrappers.ts';
  import ActiveTimers from '@/view/components/ActiveTimers.svelte';
  import TimersHistory from '@/view/components/TimersHistory.svelte';
  import { compareByDelayHandlerDescending } from '@/api/comparator.ts';

  export let metrics: TMetrics['wrapperMetrics'];

  let timeouts: TOnlineTimerMetrics[] = [];
  let intervals: TOnlineTimerMetrics[] = [];

  $: {
    intervals = [];
    timeouts = [];

    if (metrics.onlineTimers?.length) {
      metrics.onlineTimers.sort(compareByDelayHandlerDescending);

      for (const timer of metrics.onlineTimers) {
        if (timer.type === ETimerType.INTERVAL) {
          intervals.push(timer);
        } else {
          timeouts.push(timer);
        }
      }
    }
  }
</script>

{#if intervals.length}
  <ActiveTimers caption="Active Intervals" bind:metrics={intervals} />
{/if}

{#if timeouts.length}
  <ActiveTimers caption="Active Timeouts" bind:metrics={timeouts} />
{/if}

{#if metrics.setTimeoutHistory?.length}
  <TimersHistory
    caption="setTimeout History"
    bind:metrics={metrics.setTimeoutHistory}
  />
{/if}

{#if metrics.clearTimeoutHistory?.length}
  <TimersHistory
    caption="clearTimeout History"
    bind:metrics={metrics.clearTimeoutHistory}
  />
{/if}

{#if metrics.setIntervalHistory?.length}
  <TimersHistory
    caption="setInterval History"
    bind:metrics={metrics.setIntervalHistory}
  />
{/if}

{#if metrics.clearIntervalHistory?.length}
  <TimersHistory
    caption="clearInterval History"
    bind:metrics={metrics.clearIntervalHistory}
  />
{/if}
