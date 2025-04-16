<script lang="ts">
  import {
    ETimerType,
    type TOnlineTimerMetrics,
  } from '../../wrapper/TimerWrapper.ts';
  import { compareByDelayThenHandlerDescending } from '../../api/comparator.ts';
  import ActiveTimers from './components/ActiveTimers.svelte';

  let { onlineTimers }: { onlineTimers: TOnlineTimerMetrics[] | null } =
    $props();
  let {
    timeouts,
    intervals,
  }: {
    timeouts: TOnlineTimerMetrics[];
    intervals: TOnlineTimerMetrics[];
  } = $derived.by(() => {
    const timeouts: TOnlineTimerMetrics[] = [];
    const intervals: TOnlineTimerMetrics[] = [];

    if (onlineTimers?.length) {
      onlineTimers.sort(compareByDelayThenHandlerDescending);

      for (const timer of onlineTimers) {
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
