<script lang="ts">
  import { useTelemetryState } from '../../state/telemetry.state.svelte.ts';

  const ts = useTelemetryState();

  function dump() {
    console.log(ts.telemetry);
  }
</script>

<button
  onclick={dump}
  title={`Dump telemetry\n(look in devtools of the devtools)`}
  aria-label="Dump telemetry"
>
  <span class="icon -console"></span>
</button>
