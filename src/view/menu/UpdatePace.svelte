<script lang="ts">
  import { Fps } from '../../api/time.ts';
  import { useConfigState } from '../../state/config.state.svelte.ts';
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import UpdatePaceAnime from './UpdatePaceAnime.svelte';

  let upsValue = $state.raw(0);
  let animeEl: UpdatePaceAnime | null = null;
  const ups = new Fps((value) => (upsValue = value)).start();
  const config = useConfigState();
  const ts = useTelemetryState();

  ts.timeOfCollection.subscribe(() => {
    ups.tick();
    animeEl?.tick();
  });
</script>

<div
  class="spinner"
  title="Pace of update"
  class:tc-attention={config.paused}
>
  <div>{upsValue} u/s</div>
  <UpdatePaceAnime bind:this={animeEl} />
</div>

<style lang="scss">
  .spinner {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    line-height: 1;
  }
</style>
