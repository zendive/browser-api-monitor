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

<button interestfor={popoverId} popovertarget={popoverId}>
  <Variable value={online} />

  <div id={popoverId} class="tooltip" popover="hint" ontoggle={onToggle}>
    {#if popoverShown}
      <CellOnlinePopoverBody {traceId} />
    {/if}
  </div>
</button>

<style lang="scss">
  button {
    &:interest-source {
      color: var(--attention);
    }
  }

  .tooltip {
    inset: unset;
    position-area: center bottom;
    max-height: 10rem;
    background-color: var(--bg-popover);
    border: 1px solid var(--border);
  }
</style>
