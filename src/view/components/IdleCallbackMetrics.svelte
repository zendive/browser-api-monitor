<script lang="ts">
  import type { TMetrics } from '../../api-monitor-cs-main.ts';
  import IdleCallbackRequestHistory from './IdleCallbackRequestHistory.svelte';
  import IdleCallbackCancelHistory from './IdleCallbackCancelHistory.svelte';

  let { metrics }: { metrics: TMetrics['wrapperMetrics'] } = $props();
</script>

{#if metrics.ricHistory?.length}
  <IdleCallbackRequestHistory
    caption="requestIdleCallback History"
    metrics={metrics.ricHistory}
    cicHistory={metrics.cicHistory}
  />
{/if}

{#if metrics.cicHistory?.length}
  <IdleCallbackCancelHistory
    caption="cancelIdleCallback History"
    metrics={metrics.cicHistory}
  />
{/if}
