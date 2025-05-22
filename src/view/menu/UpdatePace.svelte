<script lang="ts">
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import { startAnimation, updateAnimation } from './UpdatePaceTimeMap.ts';
  import { onMount } from 'svelte';

  let canvasEl: HTMLCanvasElement | null = null;
  const ts = useTelemetryState();

  onMount(() => {
    const ctx = canvasEl && canvasEl.getContext('2d');

    if (ctx) {
      ts.timeOfCollection.subscribe(updateAnimation);
      return startAnimation(ctx);
    }
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

    canvas {
      border-radius: 50%;
      // downscaled
      width: 20px;
      height: 20px;
    }
  }
</style>
