<script lang="ts">
  import Variable from '../../shared/Variable.svelte';
  import CellOnlinePopoverBody from './CellOnlinePopoverBody.svelte';

  const {
    traceId,
    popoverId,
    online,
  }: {
    traceId: string;
    popoverId: string;
    online: number;
  } = $props();
  const hintPopoverId = $derived.by(() => `${popoverId}_${traceId}`);
  let popoverShown = $state(false);

  function onToggle(e: ToggleEvent) {
    popoverShown = e.newState === 'open';
  }
</script>

<button
  interestfor={hintPopoverId}
  popovertarget={hintPopoverId}
  class:popover-target-active={popoverShown}
  aria-label="Online timers"
>
  <Variable value={online} />
</button>

<div
  popover="hint"
  ontoggle={onToggle}
  id={hintPopoverId}
  class="popover"
  role="dialog"
>
  {#if popoverShown}
    <CellOnlinePopoverBody {traceId} />
  {/if}
</div>

<style lang="scss">
  .popover {
    position-area: block-end span-inline-start;
    max-height: 10rem;
    background-color: var(--bg-popover);
    border: 1px solid var(--attention);
    padding: 0;
  }
</style>
