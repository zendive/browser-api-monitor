<script lang="ts">
  import type { TMetrics } from '../../api-monitor-cs-main.ts';
  import { ETimerType, type TOnlineTimerMetrics } from '../../wrapper/main.ts';
  import ActiveTimers from './ActiveTimers.svelte';
  import TimersSetHistory from './TimersSetHistory.svelte';
  import TimersClearHistory from './TimersClearHistory.svelte';
  import { compareByDelayThenHandlerDescending } from '../../api/comparator.ts';

  let { metrics }: { metrics: TMetrics['wrapperMetrics'] } = $props();
  let {
    timeouts,
    intervals,
  }: {
    timeouts: TOnlineTimerMetrics[];
    intervals: TOnlineTimerMetrics[];
  } = $derived.by(() => {
    const timeouts: TOnlineTimerMetrics[] = [];
    const intervals: TOnlineTimerMetrics[] = [];

    if (metrics.onlineTimers?.length) {
      metrics.onlineTimers.sort(compareByDelayThenHandlerDescending);

      for (const timer of metrics.onlineTimers) {
        if (timer.type === ETimerType.TIMEOUT) {
          timeouts.push(timer);
        } else {
          intervals.push(timer);
        }
      }
    }

    return { timeouts, intervals };
  });
</script>

{#if intervals.length}
  <ActiveTimers caption="Active Intervals" metrics={intervals} />
{/if}

{#if timeouts.length}
  <ActiveTimers caption="Active Timeouts" metrics={timeouts} />
{/if}

{#if metrics.setTimeoutHistory?.length}
  <TimersSetHistory
    caption="setTimeout History"
    metrics={metrics.setTimeoutHistory}
    clearTimeoutHistory={metrics.clearTimeoutHistory}
    clearIntervalHistory={metrics.clearIntervalHistory}
  />
{/if}

{#if metrics.clearTimeoutHistory?.length}
  <TimersClearHistory
    caption="clearTimeout History"
    metrics={metrics.clearTimeoutHistory}
  />
{/if}

{#if metrics.setIntervalHistory?.length}
  <TimersSetHistory
    caption="setInterval History"
    metrics={metrics.setIntervalHistory}
    clearTimeoutHistory={metrics.clearTimeoutHistory}
    clearIntervalHistory={metrics.clearIntervalHistory}
  />
{/if}

{#if metrics.clearIntervalHistory?.length}
  <TimersClearHistory
    caption="clearInterval History"
    metrics={metrics.clearIntervalHistory}
  />
{/if}
