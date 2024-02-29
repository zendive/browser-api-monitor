<script lang="ts">
  import type { TVideoMetrics } from '@/api/videoMonitor';
  import VideoMetrics from './VideoMetrics.svelte';

  export let metrics: TVideoMetrics[] = [];
</script>

<section class="group">
  {#each metrics as videoMetrics}
    <VideoMetrics bind:metrics={videoMetrics} />
  {/each}
</section>

<style lang="scss">
  .group {
    display: flex;
    flex-wrap: wrap;
  }
</style>
