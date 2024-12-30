<script lang="ts">
  import { Fps } from '../../api/time.ts';

  const FRAMES = '⣷⣯⣟⡿⢿⣻⣽⣾';
  let index = 0;
  let frame = FRAMES[index];

  let fpsValue = 0;
  const fps = new Fps((value) => (fpsValue = value)).start();

  export function tick() {
    index = ++index % FRAMES.length;
    frame = FRAMES[index];
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
