<script lang="ts">
  import MediaMetrics from './MediaMetrics.svelte';
  import Variable from '../../shared/Variable.svelte';
  import type { ESortOrder } from '../../../api/const.ts';
  import {
    EMediaType,
    type IMediaMetrics,
    type IMediaTelemetry,
  } from '../../../wrapper/MediaWrapper.ts';
  import { useConfigState } from '../../../state/config.state.svelte.ts';
  import { compareByFieldOrder } from '../shared/comparator.ts';
  import { saveLocalStorage } from '../../../api/storage/storage.local.ts';
  import ColumnSortable from '../shared/ColumnSortable.svelte';

  let { media }: { media: IMediaTelemetry } = $props();
  const { sortVideoPanel, sortAudioPanel } = useConfigState();
  const videoMetrics = $derived.by(() =>
    media.collection.filter((v) => v.type === EMediaType.VIDEO)
  );
  const audioMetrics = $derived.by(() =>
    media.collection.filter((v) => v.type === EMediaType.AUDIO)
  );
  const sortedVideoMetrics = $derived.by(() =>
    videoMetrics.toSorted(
      compareByFieldOrder(sortVideoPanel.field, sortVideoPanel.order),
    )
  );
  const sortedAudioMetrics = $derived.by(() =>
    audioMetrics.toSorted(
      compareByFieldOrder(sortAudioPanel.field, sortAudioPanel.order),
    )
  );

  function updateVideoSort(field: keyof IMediaMetrics, order: ESortOrder) {
    sortVideoPanel.field = field;
    sortVideoPanel.order = order;
    saveLocalStorage({ sortVideoPanel });
  }

  function updateAudioSort(field: keyof IMediaMetrics, order: ESortOrder) {
    sortAudioPanel.field = field;
    sortAudioPanel.order = order;
    saveLocalStorage({ sortAudioPanel });
  }
</script>

{#if sortedVideoMetrics.length}
  <section data-navigation-tag="Videos">
    <div class="label bc-invert sticky-header">
      <ColumnSortable
        sort={sortVideoPanel}
        by="firstSeen"
        update={updateVideoSort}
      >
        Videos: <Variable value={sortedVideoMetrics.length} />
      </ColumnSortable>
    </div>
    <div class="list">
      {#each sortedVideoMetrics as metric (metric.mediaId)}
        <MediaMetrics
          mediaId={metric.mediaId}
          events={metric.events}
          props={metric.props}
        />
      {/each}
    </div>
  </section>
{/if}

{#if sortedAudioMetrics.length}
  <section data-navigation-tag="Audios">
    <div class="label bc-invert sticky-header">
      <ColumnSortable
        sort={sortAudioPanel}
        by="firstSeen"
        update={updateAudioSort}
      >
        Audios: <Variable value={sortedAudioMetrics.length} />
      </ColumnSortable>
    </div>
    <div class="list">
      {#each sortedAudioMetrics as metric (metric.mediaId)}
        <MediaMetrics
          mediaId={metric.mediaId}
          events={metric.events}
          props={metric.props}
        />
      {/each}
    </div>
  </section>
{/if}

<style lang="scss">
  .list {
    display: flex;
    flex-wrap: wrap;
  }

  .label {
    display: flex;
    align-items: center;
    font-weight: bold;
    width: 100%;
    height: 1.125rem;
  }
</style>
