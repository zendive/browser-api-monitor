<script lang="ts">
  import {
    ETimerType,
    type TOnlineTimerMetrics,
  } from '../../../wrapper/TimerWrapper.ts';
  import { compareByDelayThenHandlerDescending } from '../shared/comparator.ts';
  import OnlineTimers from './OnlineTimers.svelte';

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
  <OnlineTimers caption="Active Intervals" metrics={intervals} />
{/if}

{#if timeouts.length}
  <OnlineTimers caption="Active Timeouts" metrics={timeouts} />
{/if}
