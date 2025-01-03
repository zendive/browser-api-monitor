<script lang="ts">
  import type { TMetrics } from '../../api-monitor-cs-main.ts';
  import AnimationHistory from './AnimationHistory.svelte';

  let { metrics }: { metrics: TMetrics['wrapperMetrics'] } = $props();
</script>

{#if metrics.rafHistory?.length}
  <AnimationHistory
    caption="requestAnimationFrame History"
    metrics={metrics.rafHistory}
  />
{/if}

{#if metrics.cafHistory?.length}
  <AnimationHistory
    caption="cancelAnimationFrame History"
    metrics={metrics.cafHistory}
  />
{/if}
