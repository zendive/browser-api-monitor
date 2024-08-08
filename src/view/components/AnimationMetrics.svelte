<script lang="ts">
  import type { TMetrics } from '@/api-monitor-cs-main.ts';
  import AnimationHistory from '@/view/components/AnimationHistory.svelte';

  export let metrics: TMetrics['wrapperMetrics'];
</script>

{#if metrics.rafHistory?.length}
  <AnimationHistory
    caption="requestAnimationFrame History"
    bind:metrics={metrics.rafHistory}
  />
{/if}

{#if metrics.cafHistory?.length}
  <AnimationHistory
    caption="cancelAnimationFrame History"
    bind:metrics={metrics.cafHistory}
  />
{/if}
