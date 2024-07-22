<script lang="ts">
  import { Fps } from '@/api/time.ts';

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

<span title="Telemetry updates per second">{fpsValue}fps</span>
<span>{frame}</span>
