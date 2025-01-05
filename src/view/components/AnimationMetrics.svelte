<script lang="ts">
  import type { TMetrics } from '../../api-monitor-cs-main.ts';
  import AnimationRequestHistory from './AnimationRequestHistory.svelte';
  import AnimationCancelHistory from './AnimationCancelHistory.svelte';

  let { metrics }: { metrics: TMetrics['wrapperMetrics'] } = $props();
</script>

{#if metrics.rafHistory?.length}
  <AnimationRequestHistory
    caption="requestAnimationFrame History"
    metrics={metrics.rafHistory}
  />
{/if}

{#if metrics.cafHistory?.length}
  <AnimationCancelHistory
    caption="cancelAnimationFrame History"
    metrics={metrics.cafHistory}
  />
{/if}
