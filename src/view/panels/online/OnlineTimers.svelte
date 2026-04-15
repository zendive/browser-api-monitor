<script lang="ts">
  import {
    ETimerType,
    type IOnlineTimerMetrics,
  } from '../../../wrapper/TimerWrapper.ts';
  import { compareByDelayThenHandlerDescending } from '../shared/comparator.ts';
  import OnlineTimer from './OnlineTimer.svelte';

  let { onlineTimers }: { onlineTimers: IOnlineTimerMetrics[] | null } =
    $props();
  let timeouts = $derived.by(() =>
    (onlineTimers || []).filter((o) => o.type === ETimerType.TIMEOUT).sort(
      compareByDelayThenHandlerDescending,
    )
  );
  let intervals = $derived.by(() =>
    (onlineTimers || []).filter((o) => o.type === ETimerType.INTERVAL).sort(
      compareByDelayThenHandlerDescending,
    )
  );
</script>

{#if intervals.length}
  <OnlineTimer caption="Active Intervals" metrics={intervals} />
{/if}

{#if timeouts.length}
  <OnlineTimer caption="Active Timeouts" metrics={timeouts} />
{/if}
