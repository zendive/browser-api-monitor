<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellOnlinePopoverBody from './CellOnlinePopoverBody.svelte';

  const { traceId, online }: { traceId: string; online: number } = $props();
  const popoverId = $derived.by(() => `_${traceId}`);
  let popoverShown = $state(false);

  function onToggle(e: ToggleEvent) {
    popoverShown = e.newState === 'open';
  }
</script>

<button
  interestfor={popoverId}
  popovertarget={popoverId}
  class:-popoverShown={popoverShown}
  aria-label="Online timers"
>
  <Variable value={online} />
</button>

<div
  popover="hint"
  ontoggle={onToggle}
  id={popoverId}
  class="popover"
  role="dialog"
>
  {#if popoverShown}
    <CellOnlinePopoverBody {traceId} />
  {/if}
</div>

<style lang="scss">
  button.-popoverShown {
    background-color: var(--bg-invert);
    color: var(--text-invert);
  }

  .popover {
    position-area: block-end span-inline-start;
    max-height: 10rem;
    background-color: var(--bg-popover);
    border: 1px solid var(--border);
    padding: 0;
  }
</style>
