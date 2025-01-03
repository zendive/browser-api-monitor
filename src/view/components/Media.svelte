<script lang="ts">
  import { TMediaType, type TMediaTelemetry } from '../../api/mediaMonitor.ts';
  import MediaMetrics from './MediaMetrics.svelte';
  import Variable from './Variable.svelte';

  let { metrics = { total: 0, collection: [] } }: { metrics: TMediaTelemetry } =
    $props();
  let videos = $derived.by(() =>
    metrics.collection.filter((v) => v.type === TMediaType.VIDEO)
  );
  let audios = $derived.by(() =>
    metrics.collection.filter((v) => v.type === TMediaType.AUDIO)
  );
</script>

{#if metrics.collection.length}
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
