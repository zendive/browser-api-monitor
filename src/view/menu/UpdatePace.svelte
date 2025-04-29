<script lang="ts">
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import { startAnimation, update } from './UpdatePaceTimeMap.ts';
  import { onMount } from 'svelte';

  let canvasEl: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  const ts = useTelemetryState();

  onMount(() => {
    ctx = canvasEl && canvasEl.getContext('2d');
    return ctx && startAnimation(ctx);
  });

  ts.timeOfCollection.subscribe((v) => {
    update(v);
  });
</script>

<div
  class="time-map"
  title="Time map"
>
  <canvas bind:this={canvasEl}></canvas>
</div>

<style lang="scss">
  .time-map {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    line-height: 1;

    canvas {
      border-radius: 50%;
      // downscaled
      width: 20px;
      height: 20px;
    }
  }
</style>
