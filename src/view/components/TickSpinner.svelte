<script lang="ts">
  import { Fps } from '../../api/time.ts';

  const FRAMES = '⣷⣯⣟⡿⢿⣻⣽⣾';
  let index = $state.raw(0);
  let fpsValue = $state.raw(0);
  let frame = $derived.by(() => FRAMES[index]);
  const fps = new Fps((value) => (fpsValue = value)).start();

  export function tick() {
    index = ++index % FRAMES.length;
    fps.tick();
  }
</script>

<div class="spinner">
  <div title="Pace of update">{fpsValue}fps</div>
  <div>{frame}</div>
</div>

<style lang="scss">
  .spinner {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    line-height: 1;
  }
</style>
