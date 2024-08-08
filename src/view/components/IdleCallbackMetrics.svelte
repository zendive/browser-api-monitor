<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import IdleCallbackRequestHistory from '@/view/components/IdleCallbackRequestHistory.svelte';
  import IdleCallbackCancelHistory from '@/view/components/IdleCallbackCancelHistory.svelte';

  export let metrics: TMetrics['wrapperMetrics'];
</script>

{#if metrics.ricHistory?.length}
  <IdleCallbackRequestHistory
    caption="requestIdleCallback History"
    bind:metrics={metrics.ricHistory}
    bind:cicHistory={metrics.cicHistory}
  />
{/if}

{#if metrics.cicHistory?.length}
  <IdleCallbackCancelHistory
    caption="cancelIdleCallback History"
    bind:metrics={metrics.cicHistory}
  />
{/if}
