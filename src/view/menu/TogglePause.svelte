<script lang="ts">
  import {
    togglePause,
    useConfigState,
  } from '../../state/config.state.svelte.ts';

  const config = useConfigState();
</script>

<button
  onclick={togglePause}
  title="Toggle pause"
  aria-label="Toggle pause"
>
  <span class="icon {config.paused?'-play':'-pause'}"></span>
</button>
