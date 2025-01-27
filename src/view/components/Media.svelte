<script lang="ts">
  import {
    EMediaType,
    type TMediaTelemetry,
  } from '../../wrapper/MediaWrapper.ts';
  import MediaMetrics from './MediaMetrics.svelte';
  import Variable from './Variable.svelte';

  let { media = { total: 0, collection: [] } }: { media: TMediaTelemetry } =
    $props();
  let videos = $derived.by(() =>
    media.collection.filter((v) => v.type === EMediaType.VIDEO)
  );
  let audios = $derived.by(() =>
    media.collection.filter((v) => v.type === EMediaType.AUDIO)
  );
</script>

{#if media.collection.length}
  {#if videos.length}
    <section data-navigation-tag="Videos">
      <div class="label bc-invert">
        Videos: <Variable value={videos.length} />
      </div>
      <div class="list">
        {#each videos as videoMetrics (videoMetrics.mediaId)}
          <MediaMetrics metrics={videoMetrics} />
        {/each}
      </div>
    </section>
  {/if}

  {#if audios.length}
    <section data-navigation-tag="Audios">
      <div class="label bc-invert">
        Audios: <Variable value={audios.length} />
      </div>
      <div class="list">
        {#each audios as audioMetrics (audioMetrics.mediaId)}
          <MediaMetrics metrics={audioMetrics} />
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
