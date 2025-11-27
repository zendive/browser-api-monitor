<script lang="ts">
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';
  import { startAnimation, updateAnimation } from './UpdatePaceTimeMap.ts';
  import { onMount } from 'svelte';

  let canvasEl: HTMLCanvasElement | null = null;
  const ts = useTelemetryState();

  $effect(() => void updateAnimation(ts.timeOfCollection));

  onMount(() => {
    const ctx = canvasEl!.getContext('2d');
    return startAnimation(ctx!);
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
