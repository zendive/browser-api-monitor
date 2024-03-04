<script lang="ts">
  import { TMediaType, type TMediaMetrics } from '@/api/mediaMonitor';
  import MediaMetrics from './MediaMetrics.svelte';
  import Variable from './Variable.svelte';

  export let metrics: TMediaMetrics[] = [];

  $: videos = metrics.filter((v) => v.type === TMediaType.VIDEO);
  $: audios = metrics.filter((v) => v.type === TMediaType.AUDIO);
</script>

<section>
  <div class="label bc-invert">
    Videos: <Variable bind:value={videos.length} />
  </div>
  <div class="list">
    {#each videos as videoMetrics}
      <MediaMetrics caption="Video" bind:metrics={videoMetrics} />
    {/each}
  </div>
</section>

<section>
  <div class="label bc-invert">
    Audios: <Variable bind:value={audios.length} />
  </div>
  <div class="list">
    {#each audios as audioMetrics}
      <MediaMetrics caption="Audio" bind:metrics={audioMetrics} />
    {/each}
  </div>
</section>

<style lang="scss">
  .list {
    display: flex;
    flex-wrap: wrap;
  }

  .label {
    font-weight: bold;
    width: 100%;
  }
</style>
