<script lang="ts">
  import { TMediaType, type TMediaTelemetry } from '@/api/mediaMonitor.ts';
  import MediaMetrics from '@/view/components/MediaMetrics.svelte';
  import Variable from '@/view/components/Variable.svelte';

  export let metrics: TMediaTelemetry = { total: 0, collection: [] };

  $: videos = metrics.collection.filter((v) => v.type === TMediaType.VIDEO);
  $: audios = metrics.collection.filter((v) => v.type === TMediaType.AUDIO);
</script>

{#if metrics.collection.length}
  {#if videos.length}
    <section>
      <div class="label bc-invert">
        Videos: <Variable bind:value={videos.length} />
      </div>
      <div class="list">
        {#each videos as videoMetrics (videoMetrics.mediaId)}
          <MediaMetrics caption="Video" bind:metrics={videoMetrics} />
        {/each}
      </div>
    </section>
  {/if}

  {#if audios.length}
    <section>
      <div class="label bc-invert">
        Audios: <Variable bind:value={audios.length} />
      </div>
      <div class="list">
        {#each audios as audioMetrics (audioMetrics.mediaId)}
          <MediaMetrics caption="Audio" bind:metrics={audioMetrics} />
        {/each}
      </div>
    </section>
  {/if}
{/if}

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
