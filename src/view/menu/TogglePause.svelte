<script lang="ts">
  import {
    togglePause,
    useConfigState,
  } from '../../state/config.state.svelte.ts';

  const config = useConfigState();
</script>

<button
  type="button"
  onclick={togglePause}
  title="Toggle pause telemetry"
  aria-label="Toggle pause telemetry"
>
  <span class="icon {config.paused?'-play':'-pause'}"></span>
</button>
